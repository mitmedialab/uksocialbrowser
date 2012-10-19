var GRouter = Backbone.Router.extend({
  routes: {
    ":left/:right": "categories",
    "": "nocategory"
  },
  
  nocategory: function(){
    g_view.load_paper_data(g_view.render_article_count_graph);
  },

  categories: function(left,right){
    el = {"left":"#sorted_bargraph_left", "right":"#sorted_bargraph_right"}
    arg = {"left":left, "right":right}


    $.each(["left", "right"], function(i, k){
      v = el[k]
      
      $("#" + k  + "_select option").filter(function() {
        //may want to use $.trim in here
        return $(this).val() == arg[k]; 
      }).attr('selected', true);

      switch(arg[k]){
        case "articlepercent":
          g_view.load_paper_data(g_view.render_article_percent_graph, v);
          break
        case "socialvolume":
          g_view.load_paper_data(g_view.render_article_count_social_graph, v);
          break;
        case "socialpercent":
          g_view.load_paper_data(g_view.render_article_social_percent_graph, v);
          break;
        case "articlevolume":
          g_view.load_paper_data(g_view.render_article_count_graph, v);
          break;
      }
    });
  }
});

window.launch();
