"use strict";

var App = App || {};

let FilterDropdownController = function() {
  let self = {
    filterDropdownList: null,
    allServicesButton: null,

    filters: {}, // equivalent to subcategory states

    mainCategoryStates: {},
    mainStateToIcon: {
      "none": "glyphicon-unchecked",
      "some": "glyphicon-plus",
      "all": "glyphicon-check"
    }
  };

  init();

  function init() {}

  function attachAllServicesButton(id) {
    self.allServicesButton = d3.selectAll(id)
      .on('click', resetFilters)
  }

  function resetFilters() {
    console.log("Reset Filters");

    let current_service_properties = {
      type: "service"
    };

    current_service_properties.subType = (Object.keys(self.filters).length === 1) ? Object.keys(self.filters)[0] : "All";
    current_service_properties.subFilters = self.filters;

    self.filters = {};

    for (let mainCategory of Object.keys(self.mainCategoryStates)) {
      if (self.mainCategoryStates[mainCategory] !== "none"){
        current_service_properties.mainType = mainCategory;
      }
      self.mainCategoryStates[mainCategory] = "none";
    }

    console.log("current_service_properties",current_service_properties);
    // App.views.chartList.removeServiceChart(current_service_properties);

    self.filterDropdownList.selectAll(".glyphicon")
      .attr("class", "glyphicon glyphicon-unchecked");

    self.filterDropdownButton.selectAll('#currentServiceSelection').text("Select Services...");
    self.filterDropdownButton.selectAll('#service-dropdown-marker').style('color',null);
    self.filterDropdownButton.attr("class", "btn btn-default dropdown-toggle navbar-btn rounded");

    self.allServicesButton.style('display','none');

    filtersUpdated();
  }

  function setFilterDropdown(listID, buttonID) {
    self.filterDropdownList = d3.selectAll(listID);
    self.filterDropdownButton = d3.selectAll(buttonID);
  }

  function populateDropdown(max_height) {
    let tier1Categories = App.models.serviceTaxonomy.getTier1Categories();

    for (let category of tier1Categories) {
      self.mainCategoryStates[category] = "none"; // "some", "all"
    }

    self.filterDropdownList.selectAll(".mainType")
      .data(tier1Categories)
    .enter().append("li")
      .attr("class", "dropdown-submenu serviceType")
      .each(function(c1) {
        let listItem = d3.select(this);
        let tier2Categories = App.models.serviceTaxonomy.getTier2CategoriesOf(c1);

        // create link within tab
        listItem.append("a")
          .attr("tabindex", -1)
          .attr("id", "main_" + convertPropertyToID(c1))
          .html("<span class='glyphicon glyphicon-unchecked'></span>" + c1)
          // .on((L.Browser.mobile ? "click" : "mouseover"), function (d) {
          //   d3.event.stopPropagation();

          //   self.filterDropdownList.selectAll(".serviceType").classed("open", false);
          //   d3.select(this).node().parentNode.classList.toggle("open");
          // });
          .on("mouseover", function (d) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            self.filterDropdownList.selectAll(".serviceType").each(function (d) {
              let curElem = d3.select(this);
              curElem.selectAll(".dropdown-menu").classed("hidden", !curElem.classed("open"));
            });
          }).on("click", function (d) {
            d3.event.stopPropagation();
            d3.event.preventDefault();

            let parent = d3.select(d3.select(this).node().parentNode);
            let parentState = parent.classed("open");

            self.filterDropdownList.selectAll(".serviceType").classed("open", false)
              .selectAll(".dropdown-menu").classed("hidden", true);
            parent.classed("open", !parentState);
            parent.selectAll(".dropdown-menu").classed("hidden", !parent.classed("open"));
          });

        // create tab content div for this t1 category
        let secondaryDropdown = listItem.append("ul")
          .attr("class", "dropdown-menu");


        secondaryDropdown.append("li")
          .attr("class", "serviceSubtype")
          .append("a")
          .datum(c1)
          .attr("id", "main_" + convertPropertyToID(c1))
          .html("<span class='glyphicon glyphicon-unchecked'></span>Select All")
          .on("click", function (c1) {
            // d3.event.stopPropagation(); // prevent menu close on link click
            self.filterDropdownList.selectAll(".serviceType").classed("open", false);

            //reset other filters to allow for only one main category selection at a time
            for (let mainCategory of Object.keys(self.mainCategoryStates)) {
              if (mainCategory !== c1) {
                self.mainCategoryStates[mainCategory] = "none";
              }
            }
            self.filterDropdownList.selectAll(".glyphicon")
              .attr("class", "glyphicon glyphicon-unchecked");
            self.filters = {};


            //update UI for main category selection
            let selected;
            if (self.mainCategoryStates[c1] === "all") {
              // self.mainCategoryStates[c1] = "none";
              selected = false;
            } else {
              self.mainCategoryStates[c1] = "all";
              selected = true;
            }

            if (selected) {
              self.filterDropdownButton.selectAll('#currentServiceSelection').text(`${c1}`);
              self.filterDropdownButton.selectAll('#service-dropdown-marker').style('color', 'white');
              self.filterDropdownButton.attr("class", "btn btn-success dropdown-toggle navbar-btn");
              self.allServicesButton.style('display', null);
            } else {
              resetFilters();
            }

            updateMainCategoryIcon(c1);

            let current_service_properties = {
              mainType: c1,
              subType: "All",
              subFilters: [],
              type: "service"
            }

            listItem.select("ul").selectAll(".serviceSubtype")
              .each(function (d) {
                self.filters[d] = selected;
                current_service_properties.subFilters.push(d);

                updateSubCategoryIcon(d);
              });

            if(selected){
              // App.views.chartList.addServiceChart(current_service_properties);
            }

            filtersUpdated();
          });

        secondaryDropdown.append("li").attr("class", "divider");

        secondaryDropdown.selectAll(".secondaryCategory ")
          .data(tier2Categories)
          .enter().append("li")
          .attr("class", "secondaryCategory serviceSubtype")
          .append("a")
          .datum(function (c2) {
            return {
              mainType: c1,
              subType: c2
            };
          })
          .attr("id", d => "sub_" + convertPropertyToID(d.subType))
          .html(function (d) {
            return "<span class='glyphicon glyphicon-unchecked'></span>" + d.subType;
          })
          .on("click", function (d) {
            // d3.event.stopPropagation(); // prevent menu close on link click

            //reset other filters to allow for only one sub category selection at a time
            let isMainCategorySelection = Object.keys(self.filters).length > 1;
            for (let mainCategory of Object.keys(self.mainCategoryStates)) {
              if (mainCategory !== d.mainType) {
                self.mainCategoryStates[mainCategory] = "none";
              }
            }
            self.filterDropdownList.selectAll(".glyphicon")
              .attr("class", "glyphicon glyphicon-unchecked");
            listItem.select("ul").selectAll(".serviceSubtype")
              .each(function (subType) {
                if (subType !== d.subType) {
                  self.filters[subType] = false;

                  updateSubCategoryIcon(subType);
                }
              });
            let curSelection = self.filters[d.subType];
            self.filters = {};

            //select current subcategory if previous filters indicate a main category selection
            if (isMainCategorySelection) {
              self.filters[d.subType] = true;
            } else {
              // toggle whether or not it is selected
              self.filters[d.subType] = !curSelection;
            }

            if (self.filters[d.subType]) {
              self.filterDropdownButton.selectAll('#currentServiceSelection').text(`${_.truncate(d.subType, { length: 30 })}`);
              self.filterDropdownButton.selectAll('#service-dropdown-marker').style('color', 'white');
              self.filterDropdownButton.attr("class", "btn btn-success dropdown-toggle navbar-btn");
              self.allServicesButton.style('display', null);

              // App.views.chartList.addServiceChart({
              //   mainType: d.mainType,
              //   subType: d.subType,
              //   type: "service"
              // });
            } else {
              resetFilters();
            }

            updateSubCategoryIcon(d.subType);
            updateMainCategoryOnSubUpdate(d.mainType);

            filtersUpdated();
          });
      });

    if (max_height) {
      self.filterDropdownList.selectAll('.dropdown-submenu>.dropdown-menu') //set max height of sub-dropdowns
        .style('max-height', `${max_height}px`).style('overflow-y', 'scroll');
    }
  }

  function convertPropertyToID(propertyName) {
    return propertyName.replace(/\W+/g, '_')
  }

  function updateMainCategoryOnSubUpdate(category) {
    let subcategories = App.models.serviceTaxonomy.getTier2CategoriesOf(category);
    let hasChecked = false;
    let hasUnchecked = false;

    for (let subC of subcategories) {
      if (self.filters[subC]) {
        hasChecked = true;
      } else {
        hasUnchecked = true;
      }
    }

    if (hasChecked && hasUnchecked) {
      self.mainCategoryStates[category] = "some";
    } else if (hasChecked) {
      self.mainCategoryStates[category] = "all";
    } else {
      self.mainCategoryStates[category] = "none";
    }

    updateMainCategoryIcon(category);
  }

  function updateMainCategoryIcon(category) {
    let id = "#main_" + convertPropertyToID(category);

    /*
    let item = self.filterDropdownList.select(id);
    let state = self.mainCategoryStates[category];

    item.select(".glyphicon")
      .attr("class", "glyphicon " + self.mainStateToIcon[state]);
      */
    let item = self.filterDropdownList.selectAll(".serviceType>" + id);
    let selectAllButton = self.filterDropdownList.selectAll(".serviceSubtype>" + id);
    let state = self.mainCategoryStates[category];

    item.select(".glyphicon")
      .attr("class", "glyphicon " + self.mainStateToIcon[state]);

    if (state === "some") {
      selectAllButton.select(".glyphicon")
        .attr("class", "glyphicon glyphicon-unchecked");
    } else {
      selectAllButton.select(".glyphicon")
        .attr("class", "glyphicon " + self.mainStateToIcon[state]);
    }
  }

  function updateSubCategoryIcon(category) {
    let id = "#sub_" + convertPropertyToID(category);

    let item = self.filterDropdownList.select(id);
    let state = self.filters[category];

    item.select(".glyphicon")
        .attr("class", "glyphicon " + (state ? "glyphicon-check" : "glyphicon-unchecked"));
  }

  function getCurrentFilters(){
    let filtersToSend = {};
    for (let subcategory of Object.keys(self.filters)) {
      if (self.filters[subcategory]) {
        filtersToSend[subcategory] = true;
      }
    }
    return filtersToSend;
  }

  function filtersUpdated() {
    let filtersToSend = getCurrentFilters();

    let dataSubset = App.models.socialServices.getFilteredData(filtersToSend);

    App.views.map.updateServicesWithFilter(dataSubset);

    //show/hide buttons based on previous configuration
    let visibilityState = App.controllers.serviceMarkerView.markersAreVisible();
    App.controllers.serviceMarkerView.setVisibilityState(visibilityState);

    console.log();
  }

  return {
    setFilterDropdown,
    attachAllServicesButton,
    resetFilters,
    populateDropdown
  };
};
