define([
    'main-loader',
    'dist/widgets/oeDouglasUnitTests/js/view-models/index'
  ], (mainLoader, viewModels) => {
    let SampleViewModel = viewModels.Sample;

    before(() => {
      return mainLoader.load('widget', 'wi300080', {
        Sample: SampleViewModel
      });
    });
  
    describe("A suite", () => {
      it('has document', function () {
        expect(true).eql(true);
      })
    });
  });