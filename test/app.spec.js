define([
  'dist/app-level/oeFedexApi'
], (oeFedexApi) => {
  describe("A suite", () => {
    it('has document', function () {
      console.log(oeFedexApi);
      expect(true).eql(true);
    })
  });
});