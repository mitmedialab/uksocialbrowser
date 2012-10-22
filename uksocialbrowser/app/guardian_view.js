var GuardianView = Backbone.View.extend({
     
  events: function() {
    return {
      "change #left_select": "left_option",
      "change #right_select": "right_option",
      "mouseenter .graph_row": "row_hover",
      "mouseleave .graph_row": "row_unhover",
      "click .graph_row": "select_section"
    }
  },

  initialize: function(){
    _.bindAll(this, 'render');
    console.log("initializing...");
    var that = this;
    this.papers={"guardian":false, "dailymail":false, "telegraph":false};
    this.paper_sections = {}
    this.never_scrolled = true;
    this.width = 350;
    this.count_row_template = _.template($("#count_row_template").html());
    this.percent_row_template = _.template($("#percent_row_template").html());
    this.article_weeks_template = _.template("<%=paper%> <%=section%>: articles per week, June 2011 - July 2012");
    this.social_weeks_template = _.template("<%=paper%> <%=section%>: likes, shares, links on Facebook, Twitter, and Google+, June 2011 - July 2012")
  },

  render: function(column){
    var that = this;
  },
  
  load_paper_data: function(view, side){
    side = typeof side !== 'undefined' ? side : '#sorted_bargraph_left';

    that = this;

    jQuery.getJSON("data/guardian.json", function(sections){
      that.add_paper_data(sections);
      jQuery.getJSON("data/dailymail.json", function(sections){
        that.add_paper_data(sections);
          jQuery.getJSON("data/telegraph.json", function(sections){
          that.add_paper_data(sections);
          view.apply(that, [side]);
        });
      });
    });
  },

  left_option: function(e){
    window.location=this.build_url();
  },

  right_option: function(e){
    window.location=this.build_url();
  },

  build_url: function(){
    url="index.html#";
    url += $("#left_select").val();
    url += "/" + $("#right_select").val();
    return url;
  },

  row_hover: function(e){ 
    el = $(e.target).parent('.graph_row');
    if(el.size() ==0){el=$(e.target);}
    row_class = (el.attr('class').split(/\s+/))[1];
    $("." + row_class).toggleClass("selected");
  },

  row_unhover: function(e){
    el = $(e.target);
    $(".graph_row.selected").removeClass("selected");
  },

  add_paper_data: function(paper_data){
    that = this;

    $.each(paper_data, function(key, val){
      paper_data[key]["total_author_articles"] = val.female_author_articles + val.male_author_articles + 
        val.mixed_author_articles + val.unknown_author_articles;
      paper_data[key]["total_author_shares"] = val.female_author_shares + val.male_author_shares + val.mixed_author_shares + val.unknown_author_shares;
    });

    if(this.section_records == null){
      this.papers[paper_data[0].paper] = true;
      this.section_papers = $.extend(this.section_papers, paper_data);

      $.each(paper_data, function(k,v){
        that.paper_sections[v.paper + v.section] = v
      });

      this.section_records = crossfilter(paper_data);
      this.female_articles = this.section_records.dimension(function(d){return d.female_author_articles});
      this.female_percent = this.section_records.dimension(function(d){return parseFloat(d.female_article_percent)});
      this.total_articles = this.section_records.dimension(function(d){return d.total_author_articles});
      this.female_social_articles = this.section_records.dimension(function(d){return d.female_author_shares});
      this.female_social_percent = this.section_records.dimension(function(d){return parseFloat(d.female_social_percent)});
      this.total_article_shares = this.section_records.dimension(function(d){return d.total_author_shares});
    }else if(this.papers[paper_data[0].paper] == false){
      this.papers[paper_data[0].paper] = true;
      this.section_records.add(paper_data);   

      $.each(paper_data, function(k,v){
        that.paper_sections[v.paper + v.section] = v
      });
    }
  },

  render_article_percent_graph: function(el){
    var that = this;
    var unit_multiplier = this.width.toFixed(2)/100.00;

    $(el).empty()
    if(el.match("left")){
      that.left_index = Array();
      $.each(that.female_percent.top(Infinity), function(key, article){
        $(el).append(that.article_percent_template(article, unit_multiplier));
        that.left_index.push(article.paper + article.section);
      });
    }else{
      $.each(that.left_index, function(k,v){
        $(el).append(that.article_percent_template(that.paper_sections[v], unit_multiplier));
      });
    }
  },

  article_percent_template: function(article, unit_multiplier){
    that = this
    return that.percent_row_template({
         label: article.paper + " " + article.section,
         rowclass: article.paper+"_"+article.section,
         female: Math.round(parseFloat(article.female_article_percent)),
         mixed: Math.round(parseFloat(article.mixed_article_percent)),
         male: Math.round(parseFloat(article.male_article_percent)),
         m:unit_multiplier
    });
  },

  render_article_social_percent_graph: function(el){
    var that = this;
    var unit_multiplier = this.width.toFixed(2)/100.00;;;;;;;;;

    $(el).empty();
    if(el.match("left")){
      that.left_index = Array();
      $.each(that.female_social_percent.top(Infinity), function(key, article){
        $(el).append(that.article_social_percent_template(article, unit_multiplier));
        that.left_index.push(article.paper + article.section);
      });
    }else{
      $.each(that.left_index, function(k,v){
        $(el).append(that.article_social_percent_template(that.paper_sections[v], unit_multiplier));
      });
    }
  },

  article_social_percent_template: function(article, unit_multiplier){
    that = this;
    return that.percent_row_template({
         label: article.paper + " " + article.section,
         rowclass: article.paper+"_" + article.section,
         female: Math.round(parseFloat(article.female_social_percent)),
         mixed: Math.round(parseFloat(article.mixed_social_percent)),
         male: Math.round(parseFloat(article.male_social_percent)),
         m:unit_multiplier
      });
  },


  // left will always load before right
  render_article_count_social_graph: function(el){
    var that = this;
    tp = that.total_article_shares.top(1)[0];
    var unit_multiplier = this.width.toFixed(2)/(tp.total_author_shares).toFixed(2);

    $(el).empty()
    if(el.match("left")){
      that.left_index = Array();
      $.each(that.female_social_articles.top(Infinity), function(key, article){
        $(el).append(that.article_count_social_template(article, unit_multiplier));
        that.left_index.push(article.paper + article.section);
      });
    }else{
      //$.each(that.female_social_articles.top(Infinity), function(key, article){
      $.each(that.left_index, function(k,v){
        $(el).append(that.article_count_social_template(that.paper_sections[v], unit_multiplier));
      });
    }
  },

  article_count_social_template: function(article, unit_multiplier){
    var that = this;
    return that.count_row_template({
      label: article.paper + " " + article.section,
      rowclass: article.paper+"_"+article.section,
      female: article.female_author_shares,
      mixed: article.mixed_author_shares,
      male: article.male_author_shares,
      unknown: article.unknown_author_shares,
      m:unit_multiplier
    });
  },

  render_article_count_graph: function(el){
    var that = this;
    tp = that.total_articles.top(1)[0];
    var unit_multiplier = this.width.toFixed(2)/(tp.total_author_articles).toFixed(2);
    
    $(el).empty();
    if(el.match("left")){
      that.left_index = Array();
      $.each(that.female_articles.top(Infinity), function(key, article){
        $(el).append(that.article_count_template(article, unit_multiplier));
        that.left_index.push(article.paper + article.section);
      });
    }else{
      $.each(that.left_index, function(k,v){
        $(el).append(that.article_count_template(that.paper_sections[v], unit_multiplier));
      });
    }
  },
  
  article_count_template: function(article, unit_multiplier){
    return that.count_row_template({
      label: article.paper + " " + article.section,
      rowclass: article.paper+"_"+article.section,
      female: article.female_author_articles,
      mixed: article.mixed_author_articles,
      male: article.male_author_articles,
      unknown: article.unknown_author_articles,
      m:unit_multiplier
    });
  },

  select_section: function(e){
    el = $(e.target).parent('.graph_row');
    if(el.size() ==0){el=$(e.target);}
    paper_section = (el.attr('class').split(/\s+/))[1].split("_");
    $("#article_weeks").html(this.article_weeks_template({paper:paper_section[0], section:paper_section[1]}));
    $("#social_weeks").html(this.social_weeks_template({paper:paper_section[0], section:paper_section[1]}));
    this.load_weekly_data(paper_section[0], paper_section[1]);
    $("#weekly_data").fadeIn();
  },
  
  load_weekly_data: function(paper, section){
    $("#spinner").show()
    jQuery.getJSON("data/" + paper + "_" + section + "_articles.json", function(articles){
      that.articles = crossfilter(articles)
      that.week_dimension = that.articles.dimension(function(d){return parseInt(d.week)});
      that.week_group = that.week_dimension.group(function(date){return date;});
      that.gender_dimension = that.articles.dimension(function(d){return d.gender});
      that.gender_group = that.week_dimension.group(function(gender){return gender;});

      that.social_week_group = that.week_dimension.group(function(date){return date;});
      that.social_weeks = that.social_week_group.reduce(function(p,v){return p+v.social}, function(p,v){return p-v.social}, function(p,v){return 0;});

      that.cache_week_totals();
      that.draw_stacked_chart(that.generate_weekly_volume_data(that.week_group), "#horizchart_top svg");
      that.draw_stacked_chart(that.generate_weekly_volume_data(that.social_weeks), "#horizchart_bottom svg");
      $("#spinner").hide()
      if(that.never_scrolled){
        $.scrollTo("#timeseries_scroll_target", 300);
        that.never_scrolled = false;
      }
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
    var barcolors = {"female":"#ddaa44","male":"#66aa66","both":"#2288aa","unknown":"#ccc"}
    $.each(["female", "both", "male", "unknown"], function(i, key){
      var series ={}; 
      series["key"] = key;
      series["values"] = new Array();
      series["color"] = barcolors[key]
      that.gender_dimension.filterExact(filter_keys[key]);
      $.each(group_object.all(), function(i, row){
        series["values"].push({x:row.key, y:row.value});
      });
      graph_data.push(series)
    });
    return graph_data;
  }

});
