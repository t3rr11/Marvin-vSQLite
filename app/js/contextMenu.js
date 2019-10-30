$(document).bind("contextmenu",function(e){
  e.preventDefault();
  openMenu();
});

function openMenu() {
  $("#names > p").off('contextmenu').on('contextmenu', function(e) {
      $("#context-menu").css("left", e.pageX);
      $("#context-menu").css("top", e.pageY);
      $("#context-menu").fadeIn(200, startFocusOut());
      checkClick($(this));
  });
}

function startFocusOut(){
  $(document).on("click",function(){
    $("#context-menu").hide();
    $(document).off("click");
  });
}

function checkClick(item) {
  $("#copy-name").off('click').on('click', function() {
    console.log("You have selected " + item.text());
  });
  //console.log("You have selected " + item.attr('id'));
  //console.log("You have selected " + item.text());
}
