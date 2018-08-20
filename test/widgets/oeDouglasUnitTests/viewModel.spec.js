define([
    'loadMain',   
    'dist/widgets/oeDouglasUnitTests/js/view-models/sample'
  ], (loadMain, sampleViewModel) => {
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
        console.log(sampleViewModel);
        expect(true).eql(true);
      })
    });
  });