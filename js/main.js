// Base path to this viewer
refresh_interval = 5000;
currently_following = "";
bytes_fetched = -1;
max_display_logs = 15;
autoscroll = false;

function flash_new_feature_alert() {
    $("#new_feature_alert").fadeIn(1250, function(jq, ts) {
        $("#new_feature_alert").fadeOut(4000);
    });
}

function scroll_to_new_content() {
    // Thanks to http://stackoverflow.com/a/2440162 for being the only
    // thing on the internet I could find that actually worked for
    // this
    if (autoscroll) {
	$(window).scrollTop($('#newcontent').position().top);
    }
}

function add_new_content_marker() {
    // First, remove any existing markers
    $(".new_content_marker").remove();
    var new_content_marker = $("<div class='new_content_marker' id='newcontent'></div>");
    $("#fillme").append(new_content_marker);
}

function setup_autoscroll() {
    $("[rel=tooltip]").tooltip({placement: 'bottom'});
}

function hide_loading_msg() {
    $('#logsloading').hide();
}

function show_rest_button() {
    // poorly named function. Also creates the show less link
    var rest_icon = "<i class='icon-chevron-down' id='show_rest_icon'></i> ";
    var rest_count = $('.log_display-false').length;
    var show_rest = $("<a id='show_rest'><span id='rest_text'/></a>");

    $('#loglist').append(show_rest);
    show_rest.wrap("<li id='li-show_rest'/>");
    $('#rest_text').text(rest_count.toString() + ' more available');
    show_rest.prepend(rest_icon);

    var less_icon = "<i class='icon-chevron-up' id='hide_rest_icon'></i> ";
    var hide_rest = $("<a id='hide_rest'><span id='less_text'/></a>");
    $('#loglist').append(hide_rest);
    hide_rest.wrap("<li id='li-hide_rest'/>");
    $('#less_text').text('show less');
    hide_rest.prepend(less_icon);
    $('#li-hide_rest').hide();
}

function add_logs(log_items, show, site) {
    // log_items - items to build into the list
    // show - if the items should be displayed by default
    // site - site the log items are for
    //
    // Addition of 'site' parameter fixes bug where quickly clicking
    // between two site tabs will cause logs from the first site to
    // appear along with the second sites
    //
    // Called by build_log_list

    if (CURRENT_SITE == site) {
       $.each(log_items, function(j, item) {
            var link = make_link($(this));
            $("#loglist").append(link);
            link.wrap('<li class="log_display-' + show.toString() + ' site-' + CURRENT_SITE + '-log"></li>');
            link.prepend("<i class='icon-book'></i> ");
	});
    }
}

function click_handlers() {
    $("#li-toggle_autoscroll a").click(function(obj) {
        $("#li-toggle_autoscroll").toggleClass("active");
        autoscroll = !autoscroll;
	scroll_to_new_content();
    });

    // Instead of going away, load the link in the fillme frame
    $(".linkloader").click(function(obj) {
        var target = $(this).attr('id');
        highlight_current_log($(this));
        start_following(target);
    });

    // don't show everything all at once
    $('#show_rest').click(function(obj) {
        $('.log_display-false').slideToggle();
        $('#li-show_rest').hide();
        $('#li-hide_rest').show();
    });

    // but let us hide those things later if we want
    $('#hide_rest').click(function(obj) {
        $('.log_display-false').slideToggle();
        $('#li-hide_rest').hide();
        $('#li-show_rest').show();
    });
}

function clear_site_logs(site) {
    $('.site-' + site + '-log').remove();
    $('#li-show_rest').remove();
    $('#li-hide_rest').remove();
}

function build_log_list(data, site) {
    // Depends on add_logs
    // clear away the 'loading' message
    hide_loading_msg();

    // Extract all the links to file types in formats (not index sorters)
    var links = [];
    var formats = ['html', 'log'];
    for (index = 0; index < formats.length; index++) {
        var new_links = $(data).find('a[href$="'+formats[index]+'"]');
        for (i = 0; i < new_links.length; i++) {
            links.push(new_links[i]);
        }
    };

    // Add each link to the list and fix its pathing
    // But not all at once. There's too many!
    if (links.length > max_display_logs) {
        add_logs(links.slice(0, max_display_logs), true, site);
        add_logs(links.slice(max_display_logs), false, site);
	if (CURRENT_SITE == site) {
            show_rest_button();
	}
    } else {
        add_logs(links, true, site);
    }
}

function highlight_current_site() {
    $('#sites li').removeClass('active');
    $('#site-' + CURRENT_SITE).addClass('active');
}

function build_tabs() {
    var site_names = Object.keys(SITES);
    for (var site in SITES) {
        var site_tab = $('<li id="site-' + site + '"><a>' + site + '</a></li>');
        $('#sites').append(site_tab);
    }
    highlight_current_site();
}

function highlight_current_log(log) {
    $("#loglist").children().removeClass('active');
    log.parent().addClass('active');
    log.parent().show();
}

function highlight_named_log(log) {
    var menu_item = $("#loglist li").has("a[id='" + log + "']");
    $("#loglist").children().removeClass('active');
    menu_item.addClass('active');
}

function flash_new_content_alert() {
    $("#new_content_alert").fadeIn(1000, function(jq, ts) {
        $("#new_content_alert").fadeOut(1250);
    });
}

function start_following(log) {
    $("#fillme").html("");
    currently_following = log;

    flash_new_content_alert();

    $.ajax({
        url: SITES[CURRENT_SITE] + "/" + log,
        cache: false,
        type: "GET",
        'success': function(data, t, j) {
            $("#fillme").html("<pre>"+data+"</pre>"); // Put it all in pre
            add_new_content_marker();
            scroll_to_new_content();
            bytes_fetched = j.responseText.length;
        }
    });
    start_refresh_timer();
    // Update the browser 'location' so people can provide direct
    // links to logs
    window.history.replaceState('log', 'Taboot Tailer', '?site=' + CURRENT_SITE + '&log=' + log);
}

function start_refresh_timer() {
    $("#stop_btn").attr("disabled", false);
    timer.stop();
    timer.toggle();
}

var timer = $.timer(function() {
    refresh_log_file(currently_following, bytes_fetched);
});

timer.set({ time : refresh_interval, autostart : false });

function refresh_log_file(log, offset) {
    var range = 'bytes=' + offset.toString() + '-';
    // uncomment this next line for debugging
    // console.log("Sending header - Range: " + range);
    var opts = {
        url: SITES[CURRENT_SITE] + "/" + log,
        cache: false,
        crossDomain: true,
        type: "GET",
        'headers': {
            'Range': range,
        },
        'success': function(data, txstat, jqXHR) {
            flash_new_content_alert();
            bytes_fetched = bytes_fetched + jqXHR.responseText.length;
            add_new_content_marker();
            $("#fillme").append(data);
            scroll_to_new_content();
        },
    };
    var httpreq = $.ajax(opts);
}

function make_link(item) {
    var link_id = item.text().split('/').reverse()[0];
    var link = $('<a/>', {
        text: item.text().replace(/taboot-/, '').replace(/.html/,'').replace(/.log/,'').replace(/(\.[0-9]+)/, ''),
        "class": 'linkloader',
        "id": link_id,
    });
    return link;
}
