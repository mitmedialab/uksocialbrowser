var GuardianView = Backbone.View.extend({
     
  events: function() {
    return {
    }
  },

  initialize: function(){
    _.bindAll(this, 'render');
    var that = this;
    //this.load_section_data("guardian", "news");
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

      that.social_week_group = that.week_dimension.group(function(date){return date;});
      that.social_weeks = that.social_week_group.reduce(function(p,v){return p+v.social}, function(p,v){return p-v.social}, function(p,v){return 0;});

      that.cache_week_totals();
      that.draw_stacked_chart(that.generate_weekly_volume_data(that.week_group), "#chart1 svg");
      that.draw_stacked_chart(that.generate_weekly_volume_data(that.social_weeks), "#chart2 svg");
    });
  },

  reset_filters: function(){
    this.week_dimension.filter(null);
    this.gender_dimension.filter(null);
  },

  cache_week_totals: function(){
    this.reset_filters();
    var that = this;
    this.week_total = {};
    $.each(this.week_group.all(), function(i, row){
      that.week_total[row.key] = row.value; 
    });
  },

  draw_stacked_chart: function(graph_data, element){
    console.log(element);
    nv.addGraph(function() {
      chart = nv.models.multiBarChart();
      chart.height = 160;

      chart.xAxis
        .tickFormat(d3.format('d'));

      chart.yAxis
        .tickFormat(d3.format(',.0f'));

      d3.select(element)
        .datum(graph_data)
      .transition().duration(500).call(chart);

      //nv.utils.windowResize(chart.update);
      //return chart;
    });
  },

  generate_weekly_volume_data: function(group_object){
    var that = this;
    that.reset_filters();
    var filter_keys = {"both":"B", "female":"F", "male":"M", "unknown":"X"};
    var graph_data = new Array();
    $.each(["male", "both", "female", "unknown"], function(i, key){
      var series ={}; 
      series["key"] = key;
      series["values"] = new Array();
      that.gender_dimension.filterExact(filter_keys[key]);
      $.each(group_object.all(), function(i, row){
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
