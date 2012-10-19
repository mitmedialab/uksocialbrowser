var GuardianView = Backbone.View.extend({
     
  events: function() {
    return {
    }
  },

  initialize: function(){
    _.bindAll(this, 'render');
    console.log("initializing...");
    var that = this;
    this.width = 100;
    this.papers_loaded = 0;
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

  add_paper_data: function(paper_data){

    $.each(paper_data, function(key, val){
      paper_data[key]["total_author_articles"] = val.female_author_articles + val.male_author_articles + 
        val.mixed_author_articles + val.unknown_author_articles;
      paper_data[key]["total_author_shares"] = val.female_author_shares + val.male_author_shares + val.mixed_author_shares + val.unknown_author_shares;
    });

    if(this.section_records == null){
      this.section_records = crossfilter(paper_data);
      this.female_articles = this.section_records.dimension(function(d){return d.female_author_articles});
      this.female_percent = this.section_records.dimension(function(d){return parseFloat(d.female_article_percent)});
      this.total_articles = this.section_records.dimension(function(d){return d.total_author_articles});
      this.female_social_articles = this.section_records.dimension(function(d){return d.female_author_shares});
      this.female_social_percent = this.section_records.dimension(function(d){return parseFloat(d.female_social_percent)});
      this.total_article_shares = this.section_records.dimension(function(d){return d.total_author_shares});
    }else if(this.papers_loaded < 3){
      this.section_records.add(paper_data);   
    }
    this.papers_loaded +=1;
  },

  render_article_percent_graph: function(el){
    var that = this;
    var unit_multiplier = this.width.toFixed(2)/100.00;

    $(el).empty()
    $.each(that.female_percent.top(1000), function(key, article){
      $(el).append(that.percent_row_template({
         label: article.paper + " " + article.section,
         female: Math.round(parseFloat(article.female_article_percent)),
         mixed: Math.round(parseFloat(article.mixed_article_percent)),
         male: Math.round(parseFloat(article.male_article_percent)),
         m:unit_multiplier
      }));
    });
  },

  render_article_social_percent_graph: function(el){
    var that = this;
    var unit_multiplier = this.width.toFixed(2)/100.00;;;;;;;;;

    $(el).empty();

    $.each(that.female_social_percent.top(1000), function(key, article){
      $(el).append(that.percent_row_template({
         label: article.paper + " " + article.section,
         female: Math.round(parseFloat(article.female_social_percent)),
         mixed: Math.round(parseFloat(article.mixed_social_percent)),
         male: Math.round(parseFloat(article.male_social_percent)),
         m:unit_multiplier
      }));
    });
  },


  render_article_count_social_graph: function(el){
    var that = this;
    tp = that.total_article_shares.top(1)[0];
    var unit_multiplier = this.width.toFixed(2)/(tp.total_author_shares).toFixed(2);

    $(el).empty()
    $.each(that.female_social_articles.top(1000), function(key, article){
      $(el).append(that.count_row_template({
         label: article.paper + " " + article.section,
         female: article.female_author_shares,
         mixed: article.mixed_author_shares,
         male: article.male_author_shares,
         unknown: article.unknown_author_shares,
         m:unit_multiplier
      }));
    });
  },

  render_article_count_graph: function(el){
    var that = this;
    tp = that.total_articles.top(1)[0];
    var unit_multiplier = this.width.toFixed(2)/(tp.total_author_articles).toFixed(2);
    
    $(el).empty();
    $.each(that.female_articles.top(1000), function(key, article){
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
