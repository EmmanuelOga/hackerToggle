'use strict';

(function($){

  // We'll represent all posts/comments as nodes in a tree.
  function Node(depth, elem) {
    this.depth = depth;
    this.elem = elem;

    this.isOpen = true;
    this.children = [];
    this.children_count = 0;

    // Visit each node of the tree and run a callback with the node as parameter.
    // If the function returns true, the walking stops and the current node is
    // returned. If the callback is false, the walking continues.
    this.visitChildren = function(callback) {
      for (var i = 0; i < this.children.length; i++) {
        var currentNode = this.children[i];
        if (callback(currentNode)) { return currentNode; } // Exit mechanism: all callbacks should return false, true exists;

        var childResult = currentNode.visitChildren(callback);
        if (childResult) { return childResult; }
      }
      return false;
    };

    // visit self and children.
    this.visit = function(callback) {
      if (callback(this)) { return this; }
      return this.visitChildren(callback);
    }

    this.initToggle = function() {
      if (this.children_count > 0) {
        var $content = $('td.default', this.elem);
        $content.find('p:last').append("<font size=1>&nbsp;|&nbsp;<a class='toggle' href='javascript:void(0)'></a></font>");
        this.$toggle = $content.find('a.toggle')
        this.updateToggleText();
        this.$toggle.on('click', function(){ this.toggle(); }.bind(this));
      }
    };

    this.updateToggleText = function() {
      if (this.$toggle) {
        var prefix = this.isOpen ? 'collapse' : 'expand';
        this.$toggle.text(prefix + ' [' + this.children_count + ']');
      }
    }

    // Provide true / false to reset state, or nothing to toggle.
    this.toggle = function(newState) {
      if (arguments.length == 0)
        newState = !this.isOpen;

      this.isOpen = newState;
      var action = newState ? 'show' : 'hide';

      this.visitChildren(function(node) {
        node.elem[action]();
        node.isOpen = newState;
        node.updateToggleText();
      });

      this.updateToggleText();
    };
  };

  // At times a "More" link appears that allows you to get to the next page of messages.
  var displayingShowMorePage = (window.location.pathname == '/x');

  // Fetch all <tr> on hacker news markup corresponding to comments.
  // The tables and rows are not nested in HN, the nested effect comes
  // from an img with varying width. We'll need to convert the list
  // containing the depth information to a tree later.
  function rowsAsNodes() {
    var nodes = [];

    var $postRows = $('table:first>tbody:first').
      find('table:eq('+(displayingShowMorePage ? 1 : 2)+') tr');

    $postRows.each(function(index, tr){
      // Capture every other row.
      if (index % 2 == 0) {
        // img width determines comment nesting depth. Widths are multiples of 40.
        var depth = $('img', tr).attr('width') / 40;

        nodes.push(new Node(depth, $(tr)));
      }
    });

    return nodes;
  };

  // Since HN doesn't implement nesting with nested tables , we'll need to
  // convert the list of nodes-depth to a tree representation (to do
  // useful things like collapsing whole sub trees of comments).
  // This is en esence rebuilding an n-ary tree from a pre-order list of nodes
  // with their depth.
  function arrangeTree(nodes) {

    var nuberOfNodes = nodes.length;

    var root = new Node(-1);
    var top = root;
    var stack = [root];

    for (var i = 0; i < nuberOfNodes; i++) {

      var currentNode = nodes[i];

      while (! (top.depth < currentNode.depth) ) {
        stack.pop();
        top = stack[stack.length - 1];
      }

      top.children.push(currentNode)

      for (var j = 0; j < stack.length; j++) {
        stack[j].children_count += 1;
      };

      if (currentNode.depth > top.depth) {
        stack.push(top = currentNode);
      }
    }

    return root;
  };

  var tree = arrangeTree(rowsAsNodes());

  tree.visitChildren(function(node) { node.initToggle(); });

  // Coloring. I bet some ppl will hate it :).
  var highlightNode = function(node) {
    // Reset colors
    tree.visitChildren(function(node) { node.elem.css('background-color', ''); });

    // Paint whole subtree
    for (var i = 0; i < tree.children.length; i++) {
      var subtree = tree.children[i];

      if (subtree.visit(function(lookup) { return lookup == node; })) {
        subtree.visit(function(nodeToPaint) { nodeToPaint.elem.css('background-color', '#f2f2eb'); });
        break;
      }
    }

    // Paint clicked node background
    node.elem.css('background-color', '#d0d0d0');
  };

  // Handle click / double click of comments.
  tree.visitChildren(function(node) {
    node.elem.on('click', function() { highlightNode(node); });
    node.elem.on('dblclick', function() { highlightNode(node); node.toggle(); window.getSelection().removeAllRanges(); });
  });

  // Insert collapse all / epand all butons.
  $("tbody:eq("+(displayingShowMorePage ? 2 : 3)+")").
    prepend("<tr><td width=100%><a href='javascript:void(0)' class='collapseAll'>Collapse All</a>&nbsp;|&nbsp;<a class='expandAll' href='javascript:void(0)'>Expand All</a></td></tr>");

  $('.expandAll').click(function(){ tree.toggle(true); });
  $('.collapseAll').click(function(){
    for (var i = 0; i < tree.children.length; i++) {
      tree.children[i].toggle(false);
    }
  });

  // Collapse all by default.
  $('.collapseAll').trigger('click');
})(jQuery);
