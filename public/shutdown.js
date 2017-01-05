$( document ).ready(function(){
  $("#shutdown").click(function(){
    var token = $("#csrf").val();
    $.post("shutdown/yes", { _csrf: token })
    .fail(function() {
      $("#question").html("Server is shut down");
    });
  });
});
