define([
    'dist/widgets/oeDouglasUnitTests/js/index'
  ], (sampleViewModel) => {
    window.routePath = 'home';
  
    describe("A suite", () => {
      it('has document', function () {
        console.log(sampleViewModel);
        expect(true).eql(true);
      })
    });
  });