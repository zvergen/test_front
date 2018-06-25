'use strict';

angular.module('testApp')
  .controller('editCtrl',
    ['$scope', '$routeParams', '$location', '$log', 'elementsResource', 'ModalService',
      function ($scope, $routeParams, $location, $log, elementsResource, ModalService) {
        $scope.currentElement = null;
        $scope.iter = [];
        $log.debug($scope.data.elements);

        var id = $routeParams.id;
        $scope.currentElement = searchElement($scope.data.elements);

        function searchElement(_elements) {
          var retElem = null;
          for (var i = 0; i < _elements.length; i++) {
            if (_elements[i].id == id) {
              retElem = _elements[i];
              break;
            }
            if (_elements[i].childrens != null) {
              retElem = searchElement(_elements[i].childrens);
              if (retElem != null) {
                break;
              }
            }
          }
          return retElem;
        }

        function saveSearchElement(_elements, _newElement) {
          for (var i = 0; i < _elements.length; i++) {
            if (_elements[i].id == _newElement.id) {
              _elements[i] = _newElement;
              break;
            }
            if (_elements[i].childrens != null) {
              saveSearchElement(_elements[i].childrens, _newElement);
            }
          }
        }

        $scope.cancelEdit = function () {
          $scope.currentElement = {};
          $log.debug('Cancelling changes. Redirecting to /home');
          $location.path('/home');
        };

        $scope.saveEdit = function (element) {
          ModalService.showModal({
            templateUrl: 'modal_window.html',
            controller: 'modalConfirmCtrl',
            inputs: {
              question: "Вы действиетльно хотите СОХРАНИТЬ ИЗМЕНЕНИЯ?"
            }
          }).then(function (modal) {
            $log.debug('Showing modal window');
            modal.element.modal();
            modal.close.then(function (result) {
              if (result) {
                $log.debug('### Saving changes ###');
                saveSearchElement($scope.data.elements, element);
                elementsResource.save({id: element.id}, element).$promise.then(
                  function (value) {
                    $log.debug('### Changes saved ###');
                  });
                $log.debug('Redirecting to /home');
                $location.path('/home');
                $scope.currentElement = {};
              }
            });
          });

        }
      }
    ]);