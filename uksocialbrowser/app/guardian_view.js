var GuardianView = Backbone.View.extend({
     
  events: function() {
    return {
    }
  },

  initialize: function(){
    _.bindAll(this, 'render');
    var that = this;
    this.load_section_data("guardian", "news");
  },

  load_section_data: function(paper, section){
    var that = this;
    $("#main_container .btn-inverse").toggleClass("btn-inverse");
    $("#" + section).toggleClass("btn-inverse");
    jQuery.getJSON("data/" + paper + "_" + section + "_articles.json", function(articles){
      that.articles = crossfilter(articles)
      that.week_dimension = that.articles.dimension(function(d){return parseInt(d.week)});
      that.week_group = that.week_dimension.group(function(date){return date;});
      that.gender_dimension = that.articles.dimension(function(d){return d.gender});
      that.gender_group = that.week_dimension.group(function(gender){return gender;});
      that.social_dimension = that.articles.dimension(function(d){return parseInt(d.social)});
      that.draw_stacked_chart(that.generate_weekly_volume_data());
    });
  },

  reset_filters: function(){
    this.week_dimension.filter(null);
    this.gender_dimension.filter(null);
    this.social_dimension.filter(null);
  },

  draw_stacked_chart: function(graph_data){
    nv.addGraph(function() {
      var chart = nv.models.multiBarChart();

      chart.xAxis
        .tickFormat(d3.format(',f'));

      chart.yAxis
        .tickFormat(d3.format(',.1f'));

      d3.select('#chart1 svg')
        .datum(graph_data)
      .transition().duration(500).call(chart);

      nv.utils.windowResize(chart.update);
      return chart;
    });
  },

  generate_weekly_volume_data: function(){
    var that = this;
    that.reset_filters();
    var filter_keys = {"both":"B", "female":"F", "male":"M", "unknown":"X"};
    var graph_data = new Array();
    $.each(["male", "both", "female", "unknown"], function(i, key){
      var series ={}; 
      series["key"] = key;
      series["values"] = new Array();
      that.gender_dimension.filterExact(filter_keys[key]);
      $.each(that.week_group.all(), function(i, row){
        series["values"].push({x:row.key, y:row.value});
      });
      graph_data.push(series)
    });
    return graph_data;
  },

  render: function(column){
    var that = this;
  },

});
