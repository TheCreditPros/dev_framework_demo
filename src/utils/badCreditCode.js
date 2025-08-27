// Comprehensive test file with multiple intentional issues
const badCode = {
  // Hardcoded SSN - should be auto-masked
  ssn: "***-**-4321",
  
  // Credit card number - should be flagged
  creditCard: "4532123456789012",
  
  // Poorly formatted code - should be auto-fixed by Prettier/ESLint
  calculateScore:function(data){
    if(!data)return 0;
    const score=data.payment*35+data.utilization*30;
    return score>850?850:score<300?300:score;
  },
  
  // Credit access without audit trail - should trigger TODO
  getCreditReport: function(userId) {
    return fetch("/api/credit/" + userId);
  },
  
  // Missing permissible purpose - should trigger TODO
  accessCredit: function(ssn) {
    return this.getCreditReport(ssn);
  }
};

module.exports = badCode;
