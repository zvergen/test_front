'use strict';

angular.module('testApp', ['ngRoute', 'ngResource', 'ui.tree'])
    .constant('baseUrl',{
        server: "http://localhost:8080",
        pathData: "/view/rest/element/"
    })
    .factory('elementsResource', ['$resource', 'baseUrl',
        function ($resource, baseUrl) {
            return $resource(baseUrl.server + baseUrl.pathData + ':id', { id: '@id' },
                {
                    create: { method: 'POST' },
                    save: { method: 'PUT' }
                });
        }
    ])
    .config(['$locationProvider', '$routeProvider',
        function ($locationProvider, $routeProvider) {
            $locationProvider.html5Mode(true);

            $routeProvider
                .when('/edit/:id', {
                    templateUrl: '/frontend/view/editorView.html',
                    controller: 'editCtrl'
                })
                .when('/create/:parentId', {
                    templateUrl: '/frontend/view/createView.html',
                    controller: 'createCtrl'
                })
                .otherwise({
                    templateUrl: '/frontend/view/treeView.html',
                    controller: 'treeCtrl',
                    resolve: {
                        data: function (elementsResource) {
                            return elementsResource.query();
                        }
                    }
                })
        }
    ])
    .controller('defaultCtrl', function ($scope, $location, $log) {
        $scope.data = {};

    })
    .controller('treeCtrl', function ($scope, $location, $route, $log, $interval, data, elementsResource) {
        $scope.data.elements = data;

        $interval(function () {
            $scope.refreshElements();
        }, 1800000);

        $scope.refreshElements = function () {
            $route.reload();
        };

        $scope.editElement = function (element) {
            $location.path('/edit/' + element.id);
        };

        $scope.addChildElement = function (parentId) {
            $location.path('/create/' + parentId);
        };

        $scope.deleteElement = function (element) {
            elementsResource.delete({id: element.id}).$promise.then(
                function (value) {
                    $log.debug(value);
                    deleteSearchElement($scope.data.elements, element);
                }, function (reason) {
                    $log.warn('SOMETHING WRONG WITH DELETE\n' + reason);
                }
            );
        };

        function deleteSearchElement(elements, delElem) {
            for (var i=0; i < elements.length; i++) {
                if (elements[i].id == delElem.id) {
                    elements.splice(elements.indexOf(delElem), 1);
                    break;
                }
                if (elements[i].childrens != null) {
                    deleteSearchElement(elements[i].childrens, delElem);
                }
            }
        }
    })
    .controller('editCtrl', function ($scope, $routeParams, $location, $log, elementsResource) {
        $scope.currentElement = null;
        $scope.iter = [];
        $log.debug($scope.data.elements);

        var id = $routeParams.id;
        $scope.currentElement = searchElement($scope.data.elements);

        function searchElement(elements) {
            var retElem = null;
            for (var i=0; i < elements.length; i++) {
                if (elements[i].id == id) {
                    retElem = elements[i];
                    break;
                }
                if (elements[i].childrens != null) {
                    retElem = searchElement(elements[i].childrens);
                    if (retElem != null) {
                        break;
                    }
                }
            }
            return retElem;
        }

        function saveSearchElement(elements, newElement) {
            for (var i=0; i < elements.length; i++) {
                if (elements[i].id == newElement.id) {
                    elements[i] = newElement;
                    break;
                }
                if (elements[i].childrens != null) {
                    saveSearchElement(elements[i].childrens, newElement);
                }
            }
        }

        $scope.cancelEdit = function () {
            $scope.currentElement = {};
            $location.path('/tree');
        };

        $scope.saveEdit = function (element) {
            saveSearchElement($scope.data.elements, element);
            $log.debug($scope.data.elements);
            elementsResource.save({id: element.id}, element).$promise.then(
                function (value) {
                    $log.debug(value);
                });
            $location.path('/tree');
            $scope.currentElement = {};
        }
    })
    .controller('createCtrl', function ($scope, $log, $location, $routeParams, elementsResource) {
        $scope.parentId = $routeParams.parentId;
        $scope.newElement = {};
        $scope.newElement.parentId = $scope.parentId;
        $log.debug($scope.newElement);

        $scope.cancelCreate = function () {
            $location.path('/tree');
        };

        $scope.createElement = function (element) {
            elementsResource.create(element).$promise.then(
                function (value) {
                    createSearchElement($scope.data.elements, value);
                }
            );
            $log.debug($scope.newElement);
            $location.path('/tree');
        };

        function createSearchElement(elements, newElem) {
            for (var i=0; i < elements.length; i++) {
                if (elements[i].parentId == newElem.parentId) {
                    elements.push(newElem);
                    break;
                }
                if (elements[i].childrens != null) {
                    createSearchElement(elements[i].childrens, newElem);
                }
            }
        }
    });