'use strict';

angular.module('testApp')
  .controller('createCtrl',
    ['$scope', '$log', '$location', '$routeParams', '$rootScope', 'elementsResource', 'ModalService',
      function ($scope, $log, $location, $routeParams, $rootScope, elementsResource, ModalService) {
        $scope.parentId = $routeParams.parentId;
        $scope.parentName = $rootScope.parent.name;
        $scope.newElement = {};
        $scope.newElement.parentId = $scope.parentId;
        $log.debug($scope.newElement);

        $scope.cancelCreate = function () {
          $log.debug('### Cancelling CREATE operation. Redirecting to /home ###');
          $location.path('/home');
        };

        $scope.createElement = function (element) {
          ModalService.showModal({
            templateUrl: 'modal_window.html',
            controller: 'modalConfirmCtrl',
            inputs: {
              question: "Вы действиетльно хотите СОЗДАТЬ элемент?"
            }
          }).then(function (modal) {
            $log.debug('Showing modal window');
            modal.element.modal();
            modal.close.then(function (result) {
              if (result) {
                $log.debug('### Start CREATE operation ###');
                elementsResource.create(element).$promise.then(
                  function (value) {
                    $log.debug('Object created');
                    createSearchElement($scope.data.elements, value);
                    $log.debug('### CREATE complete ###');
                  }
                );
                $log.debug('Redirecting to /home');
                $location.path('/home');
              }
            });
          });
        };

        function createSearchElement(_elements, _newElement) {
          for (var i = 0; i < _elements.length; i++) {
            if (_elements[i].parentId == _newElement.parentId) {
              _elements.push(_newElement);
              break;
            }
            if (_elements[i].childrens != null) {
              createSearchElement(_elements[i].childrens, _newElement);
            }
          }
        }
      }
    ]);