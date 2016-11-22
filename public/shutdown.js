$( document ).ready(function(){
  $("#shutdown").click(function(){
    $.get("shutdown/yes",function(data) {
    })
    .fail(function() {
      $("#question").html("Server is shut down");
    });
  });
});
