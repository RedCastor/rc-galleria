(function (angular, $) {

    'use strict';

    // Create module
    var module = angular.module('rcGalleria', []);

    module.provider('rcGalleria', [ function () {

        var path = '';
        var theme = '';
        // default config
        var options = {
            showInfo: true,
            _toggleInfo: false
        };

        this.setPath = function(input){
            path = input;
        };

        this.setTheme = function(input){
            theme = input;
        };

        this.setOptions = function(input){
            options = input;
        };
        this.$get = function galleriaFactory(){
            return {
                path: path,
                theme: theme,
                options:options
            };
        };
    }]);

    module.directive('rcGalleria', [ '$timeout', '$log', 'rcGalleria', function ($timeout, $log, rcGalleria) {
        return {
            restrict: 'E',
            scope: {
                sources: '=',
                images: '=',
                currentIndex: '=',
                keepSource: '@',
                src: '@',
                theme: '@',
                transition: '@',
                initialTransition: '@',
                imageCrop: '@',
                showImagenav: '@',
                autoplay: '@',
                pauseOnInteraction: '@',
                responsive: '@',
                initialShowDock: '@',
                thumbnails: '@',
                showInfo: '@',
                toggleInfo: '@',
                showCounter: '@',
                clickNext: '@',
                iFrameTimeoutPoster: '@',
                iFramePoster: '@',
                videoPoster: '@'
            },
            template: '<div class="galleria" style="height: 100%; width: 100%" data-ng-class="{\'galleria-current-iframe\': currentSource.iframe, \'galleria-current-video\': currentSource.video, \'galleria-current-image\': currentSource.image }">' +
            '<div data-ng-repeat="source in sources">' +
            '<a data-ng-if="source.iframe" data-ng-href="{{source.iframe}}"><img data-ng-if="source.thumb" class="iframe" data-ng-src="{{source.thumb}}" data-title="{{source.title}}"' +
            ' data-description="{{source.description}}" alt="{{source.alt}}" />' +
            '<span data-ng-if="!source.thumb" class="iframe">{{source.title}}</span>' +
            '</a>' +
            '<a data-ng-if="source.video" data-ng-href="{{source.video}}"><img data-ng-if="source.thumb" class="video" data-ng-src="{{source.thumb}}" data-title="{{source.title}}"' +
            ' data-description="{{source.description}}" alt="{{source.alt}}" />' +
            '<span data-ng-if="!source.thumb" class="video">{{source.title}}</span>' +
            '</a>' +
            '<a data-ng-if="source.image" data-ng-href="{{source.image}}">' +
            '<img data-ng-src="{{source.thumb}}" data-title="{{source.title}}" data-description="{{source.description}}" alt="{{source.alt}}"' +
            ' data-big="{{source.big_image}}" />' +
            '</a>' +
            '</div>' +
            '</div>',
            link: function ($scope, $element, attrs) {

                var theme_path = '';

                if( angular.isDefined($scope.src) && angular.isUndefined($scope.theme)){
                    theme_path = $scope.src;
                }
                else if( angular.isDefined($scope.src) && angular.isDefined($scope.theme) ){
                    theme_path = $scope.src + '/' + $scope.theme + '/galleria.' + $scope.theme + '.min.js';
                }
                else if (rcGalleria.path.length > 0 && rcGalleria.theme.length === 0){
                    theme_path = rcGalleria.path;
                }
                else if (rcGalleria.path.length > 0 && rcGalleria.theme.length > 0){
                    theme_path = rcGalleria.path + '/' + rcGalleria.theme + '/galleria.' + rcGalleria.theme + '.min.js';
                }

                $scope.iFramePoster = $scope.iFramePoster === 'true';
                $scope.iFrameTimeoutPoster = angular.isDefined($scope.iFrameTimeoutPoster) ? parseInt($scope.iFrameTimeoutPoster, 10) : 0;
                $scope.currentSource = {};

                if (angular.isDefined($scope.images) && angular.isUndefined($scope.sources)) {
                    $scope.sources = $scope.images;
                }


                if (theme_path.length > 0) {
                    console.log(theme_path);
                    Galleria.loadTheme( theme_path );
                }


                var obj = $element.find('.galleria');
                var GalleriaApiReference;
                var initialShowDock = $scope.initialShowDock === 'true';

                $timeout(function () {

                    $scope.currentIndex = angular.isDefined($scope.currentIndex) ? parseInt($scope.currentIndex, 10) : 0;
                    $scope.currentSource = $scope.sources[$scope.currentIndex];

                    if( $scope.thumbnails != null ) {
                        switch( $scope.thumbnails ) {
                            case 'true':
                                $scope.thumbnails = true;
                                break;
                            case 'false':
                                $scope.thumbnails = false;
                                break;
                        }
                    }
                    else {
                        $scope.thumbnails = true;
                    }

                    Galleria.configure(angular.extend(rcGalleria.options,{
                        show: $scope.currentIndex,
                        keepSource: $scope.keepSource === 'true', // this prevents galleria from clearing the data source container
                        transition: $scope.transition,
                        initialTransition: $scope.transition,
                        imageCrop: $scope.imageCrop,
                        showImagenav: $scope.showImagenav === 'true',
                        autoplay: angular.isDefined($scope.autoplay) ? parseInt($scope.autoplay, 10) : false,
                        pauseOnInteraction: $scope.pauseOnInteraction === 'true',
                        responsive: $scope.responsive === 'true',
                        thumbnails: $scope.thumbnails,
                        showInfo: $scope.showInfo === 'true',
                        _toggleInfo: $scope.toggleInfo === 'true',
                        showCounter: $scope.showCounter === 'true',
                        clicknext: $scope.clickNext === 'true',
                        videoPoster: $scope.videoPoster === 'true'
                    }));

                    Galleria.run(obj, {
                        extend: function(){
                            GalleriaApiReference = this;

                            if (!$scope.iFramePoster) {
                                //Add Global style for image poster iframe hidden.
                                var style = $('<style type="text/css">.galleria-current-iframe .galleria-stage .galleria-image img { visibility: hidden; }</style>');
                                $('html > head').append(style);
                            }
                        }
                    });

                    //Display console log all gallery instance
                    $log.debug(Galleria.get());

                    //Show dock thumbnail on load

                    var firstImageLoaded = false;
                    Galleria.ready(function(e) {
                        $log.debug(e);
                        $log.debug(this);

                        //Override finder functions if iFrameTimeoutPoster.
                        if ( this._options.swipe && $scope.iFrameTimeoutPoster > 0) {
                            var self = this;

                            //Override Finger Galleria for filter remove iframe only if new current source is not ifrmae or video.
                            this.finger.config.oncomplete = function(page) {

                                var index = Math.max( 0, Math.min( parseInt( page, 10 ), self.getDataLength() - 1 ) ),
                                    data = self.getData(index);

                                $( self._thumbnails[ index ].container )
                                    .addClass( 'active' )
                                    .siblings( '.active' )
                                    .removeClass( 'active' );

                                if ( !data ) {
                                    return;
                                }

                                //Compatibility with iframe not remove on click if current source is iframe.
                                if (angular.isUndefined($scope.currentSource.iframe)) {
                                    // remove video iframes
                                    self.$( 'images' ).find( '.galleria-frame' ).css('opacity', 0).hide().find( 'iframe' ).remove();
                                }

                                if ( self._options.carousel && self._options.carouselFollow ) {
                                    self._carousel.follow( index );
                                }
                            };
                        }

                        Galleria.on("image", function(e) {

                            if ( this === GalleriaApiReference) {

                                if (!firstImageLoaded && initialShowDock === true ) {
                                    this.$('thumbnails-tab').click();
                                    firstImageLoaded = true;
                                }

                                if (angular.isDefined($scope.currentSource.iframe)) {

                                    $timeout(function () {
                                        if ( $scope.iFrameTimeoutPoster > 0 ) {
                                            $(e.imageTarget ).click();
                                            $(e.imageTarget ).trigger('mouseup');
                                        }
                                        $scope.$emit('rcGalleria.iframe-loaded', e);
                                    }, $scope.iFrameTimeoutPoster);
                                }
                                else {
                                    $scope.$emit('rcGalleria.image-loaded', e);
                                }
                            }
                        });
                        Galleria.on("loadstart", function(e) {

                            if ( this === GalleriaApiReference) {
                                $scope.currentIndex = e.index;
                                $scope.currentSource = $scope.sources[$scope.currentIndex];
                                $scope.$apply();

                                if (angular.isDefined($scope.currentSource.iframe)) {
                                    $scope.$emit('rcGalleria.iframe-load', e);
                                }
                                else {
                                    $scope.$emit('rcGalleria.image-load', e);
                                }
                            }
                        });
                    });

                });

                $scope.$on('$destroy', function() {
                    if(GalleriaApiReference && GalleriaApiReference.destroy) {
                        GalleriaApiReference.destroy();
                    }
                });
            }
        };
    }]);

}(angular, jQuery));
