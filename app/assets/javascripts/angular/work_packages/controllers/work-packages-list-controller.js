//-- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2014 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
//++

angular.module('openproject.workPackages.controllers')

.controller('WorkPackagesListController', [
    '$scope',
    '$rootScope',
    '$q',
    '$location',
    '$stateParams',
    'I18n',
    'WorkPackagesTableService',
    'WorkPackageService',
    'ProjectService',
    'QueryService',
    'PaginationService',
    'AuthorisationService',
    'WorkPackageLoadingHelper',
    'INITIALLY_SELECTED_COLUMNS',
    'OPERATORS_AND_LABELS_BY_FILTER_TYPE',
    function($scope, $rootScope, $q, $location, $stateParams,
      I18n, WorkPackagesTableService,
      WorkPackageService, ProjectService, QueryService, PaginationService,
      AuthorisationService, WorkPackageLoadingHelper, INITIALLY_SELECTED_COLUMNS,
      OPERATORS_AND_LABELS_BY_FILTER_TYPE) {


  // Setup

  function initialSetup() {
    $scope.operatorsAndLabelsByFilterType = OPERATORS_AND_LABELS_BY_FILTER_TYPE;
    $scope.loading = false;
    $scope.disableFilters = false;
    $scope.disableNewWorkPackage = true;

    var getWorkPackages, params;
    if($scope.query_id){
      getWorkPackages = WorkPackageService.getWorkPackagesByQueryId;
      params = [$scope.projectIdentifier, $scope.query_id];
    } else {
      getWorkPackages = WorkPackageService.getWorkPackagesFromUrlQueryParams;
      params = [$scope.projectIdentifier, $location];
    }

    $scope.withLoading(getWorkPackages, params)
      .then(setupPage);

    loadProjectTypesAndQueries();
  }

  function loadProjectTypesAndQueries() {
    if ($scope.projectIdentifier) {
      ProjectService.getProject($scope.projectIdentifier)
        .then(function(project) {
          $scope.project = project;
          $scope.projects = [ project ];
          $scope.availableTypes = project.embedded.types;
        });

    }

    QueryService.loadAvailableGroupedQueries($scope.projectIdentifier);
  }

  function setupPage(json) {
    initQuery(json.meta);
    setupWorkPackagesTable(json);

    initAvailableColumns();
  }

  function initQuery(metaData) {
    var storedQuery = QueryService.getQuery();

    if (storedQuery && $stateParams.query_id !== null && storedQuery.id === $scope.query_id) {
      $scope.query = storedQuery;
    } else {
      var queryData = metaData.query,
          columnData = metaData.columns;

      $scope.query = QueryService.initQuery($scope.query_id, queryData, columnData, metaData.export_formats, afterQuerySetupCallback);
    }
  }

  function afterQuerySetupCallback(query) {
    $scope.showFiltersOptions = query.filters.length > 0;
    $scope.updateBackUrl();
  }

  function setupWorkPackagesTable(json) {
    var meta = json.meta,
        workPackages = json.work_packages,
        bulkLinks = json._bulk_links;

    // register data

    // table data
    WorkPackagesTableService.setColumns($scope.query.columns);
    WorkPackagesTableService.addColumnMetaData(meta);
    WorkPackagesTableService.setGroupBy($scope.query.groupBy);
    WorkPackagesTableService.buildRows(workPackages, $scope.query.groupBy);
    WorkPackagesTableService.setBulkLinks(bulkLinks);

    // query data
    QueryService.setTotalEntries(meta.total_entries);

    // pagination data
    PaginationService.setPerPageOptions(meta.per_page_options);
    PaginationService.setPerPage(meta.per_page);
    PaginationService.setPage(meta.page);


    // yield updatable data to scope
    $scope.columns = $scope.query.columns;
    $scope.rows = WorkPackagesTableService.getRows();
    $scope.groupableColumns = WorkPackagesTableService.getGroupableColumns();
    $scope.workPackageCountByGroup = meta.work_package_count_by_group;
    $scope.totalEntries = QueryService.getTotalEntries();

    // back url
    $scope.updateBackUrl();

    // Authorisation
    $scope.disableNewWorkPackage = AuthorisationService.cannot({ links: meta._links }, "create");
  }

  function initAvailableColumns() {
    return QueryService.loadAvailableUnusedColumns($scope.projectIdentifier)
      .then(function(data){
        $scope.availableUnusedColumns = data;
      });
  }

  // Updates

  $scope.updateBackUrl = function(){
    // Easier than trying to extract it from $location
    var relativeUrl = "/work_packages";
    if ($scope.projectIdentifier){
      relativeUrl = "/projects/" + $scope.projectIdentifier + relativeUrl;
    }

    if($scope.query){
      relativeUrl = relativeUrl + "#?" + $scope.query.getQueryString();
    }

    $scope.backUrl = relativeUrl;
  };

  $scope.updateResults = function() {
    $scope.$broadcast('openproject.workPackages.updateResults');

    return $scope.withLoading(WorkPackageService.getWorkPackages, [$scope.projectIdentifier, $scope.query, PaginationService.getPaginationOptions()])
      .then(setupWorkPackagesTable);
  };

  // More

  function serviceErrorHandler(data) {
    // TODO RS: This is where we'd want to put an error message on the dom
    $scope.isLoading = false;
  }

  $scope.withLoading = function(callback, params){
    return WorkPackageLoadingHelper.withLoading($scope, callback, params, serviceErrorHandler);
  };

  // Go

  initialSetup();

  $scope.can = AuthorisationService.can;
  $scope.cannot = AuthorisationService.cannot;

  $scope.$watch(QueryService.getQueryName, function(queryName){
    $scope.selectedTitle = queryName || I18n.t('js.toolbar.unselected_title');
  });

}]);