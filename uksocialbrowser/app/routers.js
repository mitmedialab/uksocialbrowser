var GRouter = Backbone.Router.extend({
  routes: {
    ":category": "categories",
    "": "nocategory"
  },
  
  nocategory: function(){
  },

  categories: function(category){
    g_view.render(category);
  },
});

window.launch();
