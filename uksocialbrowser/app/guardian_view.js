var GuardianView = Backbone.View.extend({
     
  events: function() {
    return {
      "change #left_select": "left_option",
      "change #right_select": "right_option"
    }
  },

  initialize: function(){
    _.bindAll(this, 'render');
    console.log("initializing...");
    var that = this;
    this.papers={"guardian":false, "dailymail":false, "telegraph":false};
    this.paper_sections = {}
    this.width = 250;
    this.count_row_template = _.template($("#count_row_template").html());
    this.percent_row_template = _.template($("#percent_row_template").html());
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
    el = $(e);
    window.location=this.build_url();
  },

  right_option: function(e){
    el = $(e);
    window.location=this.build_url();
  },

  build_url: function(){
    url="index.html#";
    url += $("#left_select").val();
    url += "/" + $("#right_select").val();
    return url;
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
    $.each(that.female_percent.top(Infinity), function(key, article){
      $(el).append(that.article_percent_template(article, unit_multiplier));
    });
  },

  article_percent_template: function(article, unit_multiplier){
    that = this
    return that.percent_row_template({
         label: article.paper + " " + article.section,
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
    $.each(that.female_articles.top(Infinity), function(key, article){
      $(el).append(that.count_row_template({
         label: article.paper + " " + article.section,
         female: article.female_author_articles,
         mixed: article.mixed_author_articles,
         male: article.male_author_articles,
         unknown: article.unknown_author_articles,
         m:unit_multiplier
      }));
    });
  }

});
