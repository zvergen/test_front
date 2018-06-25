'use strict';

angular.module('testApp')
  .controller('HomeTreeCtrl',
    ['$scope', '$location', '$route', '$log', '$interval', '$rootScope', 'data', 'elementsResource', 'ModalService',
      function ($scope, $location, $route, $log, $interval, $rootScope, data, elementsResource, ModalService) {
        $scope.data.elements = data;
        $scope.data.search = null;

        $interval(function () {
          $scope.refreshElements();
        }, 1800000);

        $scope.refreshElements = function () {
          $log.debug('Checking tree data from server...');
          $route.reload();
        };

        $scope.expandAll = function () {
          $scope.$broadcast('angular-ui-tree:expand-all');
        };

        $scope.collapseAll = function () {
          $scope.$broadcast('angular-ui-tree:collapse-all');
        };

        $scope.editElement = function (element) {
          $log.debug('Redirecting to /edit');
          $location.path('/edit/' + element.id);
        };

        $scope.addChildElement = function (parent) {
          if (parent) {
            $rootScope.parent = parent;
          } else {
            $rootScope.parent = {
              id: 0,
              name: 'Root',
            };
          }
          $log.debug('Redirecting to /create');
          $location.path('/create/' + $rootScope.parent.id);
        };

        $scope.deleteElement = function (element) {
          ModalService.showModal({
            templateUrl: 'modal_window.html',
            controller: 'modalConfirmCtrl',
            inputs: {
              question: "Вы действиетльно хотите УДАЛИТЬ элемент?"
            }
          }).then(function (modal) {
            $log.debug('Showing modal window');
            modal.element.modal();
            modal.close.then(function (result) {
              if (result) {
                $log.debug('### Start DELETE process ###');
                elementsResource.delete({id: element.id}).$promise.then(
                  function (value) {
                    $log.debug('Deleting data from server');
                    $log.debug(value);
                    $log.debug('Deleting data from current tree');
                    deleteSearchElement($scope.data.elements, element);
                    $log.debug('### DELETE complete ###');
                  }, function (reason) {
                    $log.debug('Error with DELETE operation, http-status: ' + reason.status);
                  }
                );
              }
            });
          });
        };

        function deleteSearchElement(_elements, _delElement) {
          for (var i = 0; i < _elements.length; i++) {
            if (_elements[i].id == _delElement.id) {
              _elements.splice(_elements.indexOf(_delElement), 1);
              break;
            }
            if (_elements[i].childrens != null) {
              deleteSearchElement(_elements[i].childrens, _delElement);
            }
          }
        }
      }
    ]);