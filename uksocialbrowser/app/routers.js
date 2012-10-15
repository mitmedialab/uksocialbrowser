var GRouter = Backbone.Router.extend({
  routes: {
    ":category": "categories",
    "": "nocategory"
  },
  
  nocategory: function(){
  },

  categories: function(category){
    g_view.load_section_data("guardian", category);
  },
});

window.launch();
