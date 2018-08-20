define([
  'loadMain',
  'dist/app-level/sample'
], (loadMain, oeFedexApi) => {
  before(() => {
    return new Promise((resolve) => {
      loadMain.load('douglas-tests', (ko, layoutContainer, masterViewModel) => {
        console.log(layoutContainer);
        resolve();
      });
    });
  });

  describe("A suite", () => {
    it('has document', function () {
      console.log(oeFedexApi);
      expect(true).eql(true);
    })
  });
});