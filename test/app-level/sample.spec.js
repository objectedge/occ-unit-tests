define([
  'dist/app-level/sample'
], (oeFedexApi) => {
  window.routePath = 'home';

  describe("A suite", () => {
    it('has document', function () {
      console.log(oeFedexApi);
      expect(true).eql(true);
    })
  });
});