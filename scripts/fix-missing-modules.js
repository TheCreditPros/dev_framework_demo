const fs = require('fs');
const path = require('path');

// Common missing modules and their mock implementations
const commonMocks = {
  '@/utils/constants': {
    paths: {
      workflow: {
        client: {
          details: (id) => `/workflow/client/${id}`,
          create: '/workflow/client/create',
        },
        trade_line: {
          details: (id) => `/workflow/item/${id}`,
          create: '/workflow/item/create',
        },
      },
    },
  },
  '@/features/contract/api/contracts-api': {
    useGetContractVersionsQuery: 'mock-function',
  },
  '@/features/workflow/hooks/use-workflow-wait-for-event': {
    useWorkflowWaitForEvent: 'mock-function',
  },
  '@/features/client/hooks/use-client-create-fax': {
    useClientCreateFax: 'mock-function',
  },
  '@/features/user/api/user-api-slice': {
    useGetUsersQuery: 'mock-function',
  },
  '@/features/client/validation-schema/correspondence-fax-filter-schema': {
    correspondenceFaxFilterSchema: {},
    CORRESPONDENCE_FAX_FILTER_DEFAULT_VALUES: {
      recipient: '',
      fax_number: '',
      run_by: -1,
    },
  },
  '@/components/table-filter': {
    TableFilter: 'mock-component',
    FilterBody: 'mock-component',
    FilterFooter: 'mock-component',
  },
  '@/ui/select/table-actions': {
    TableActions: 'mock-component',
  },
  '@/features/workflow/api/workflow-api-slice': {
    useUpdateWorkflowMutation: 'mock-function',
    useCloneWorkflowMutation: 'mock-function',
  },
  '@/features/segments/api/segments-api-slice': {
    useUpdateSegmentMutation: 'mock-function',
  },
};

function createMockContent(modulePath) {
  const mock = commonMocks[modulePath];
  if (!mock) return null;

  let mockContent = 'vi.mock("' + modulePath + '", () => ({\n';

  for (const [key, value] of Object.entries(mock)) {
    if (typeof value === 'string') {
      if (value === 'mock-function') {
        mockContent += `  ${key}: vi.fn(),\n`;
      } else if (value === 'mock-component') {
        mockContent += `  ${key}: vi.fn(({ children, ...props }) => <div data-testid="${key
          .toLowerCase()
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .toLowerCase()}" {...props}>{children}</div>),\n`;
      }
    } else {
      mockContent += `  ${key}: ${JSON.stringify(value, null, 2)
        .split('\n')
        .map((line) => '  ' + line)
        .join('\n')},\n`;
    }
  }

  mockContent += '}));';
  return mockContent;
}

function fixMissingModules(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check for missing module errors in the test file
  for (const [modulePath, mock] of Object.entries(commonMocks)) {
    // Look for require statements that might fail
    const requirePattern = new RegExp(
      `require\\("${modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\)`,
      'g'
    );
    if (requirePattern.test(content)) {
      // Check if there's already a mock for this module
      const mockPattern = new RegExp(
        `vi\\.mock\\("${modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`,
        'g'
      );
      if (!mockPattern.test(content)) {
        // Add the mock at the top of the file after other vi.mock calls
        const mockContent = createMockContent(modulePath);
        if (mockContent) {
          // Find the last vi.mock call and add our mock after it
          const lastMockIndex = content.lastIndexOf('vi.mock(');
          if (lastMockIndex !== -1) {
            // Find the end of the last mock
            let braceCount = 0;
            let endIndex = lastMockIndex;
            for (let i = lastMockIndex; i < content.length; i++) {
              if (content[i] === '{') braceCount++;
              if (content[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                  endIndex = i + 1;
                  break;
                }
              }
            }

            // Insert our mock after the last mock
            content =
              content.slice(0, endIndex) +
              '\n\n' +
              mockContent +
              content.slice(endIndex);
            modified = true;
          } else {
            // No existing mocks, add at the top after imports
            const importEndIndex = content.lastIndexOf('import');
            if (importEndIndex !== -1) {
              const nextLineIndex = content.indexOf('\n', importEndIndex);
              if (nextLineIndex !== -1) {
                content =
                  content.slice(0, nextLineIndex + 1) +
                  '\n' +
                  mockContent +
                  content.slice(nextLineIndex + 1);
                modified = true;
              }
            }
          }
        }
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed missing modules: ${filePath}`);
    return true;
  }
  return false;
}

function findTestFiles(dir) {
  const testFiles = [];

  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.test.jsx') || item.endsWith('.test.js')) {
        testFiles.push(fullPath);
      }
    }
  }

  scanDirectory(dir);
  return testFiles;
}

function fixAllMissingModules(projectRoot) {
  console.log('🔧 Fixing missing module issues...');

  const testFiles = findTestFiles(path.join(projectRoot, 'src'));
  let fixedCount = 0;

  for (const filePath of testFiles) {
    if (fixMissingModules(filePath)) {
      fixedCount++;
    }
  }

  console.log(`✅ Fixed missing modules in ${fixedCount} files`);
}

const projectRoot = path.resolve(__dirname, '..');
fixAllMissingModules(projectRoot);
