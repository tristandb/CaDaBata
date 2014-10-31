var monthName = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
var ii = {'tweets_neutral':0,'tweets_positive':0,'tweets_negative':0,'tweets_alert':0};

(function($, block) {

// Entity formatters for use by tweet list
var entity_formatters = {
    'urls': function(e) {
        return '<a href="' + e.url + '" target="_blank">' + e.display_url + '</a>';
    },
    
    'user_mentions': function(e) {
        return '<a href="https://twitter.com/'+e.screen_name+'" target="_blank">@'+e.screen_name+'</a>';
    },

    'hashtags': function(e) {
        return '<a href="https://twitter.com/hashtag/'+e.text+'?src=hash" target="_blank">#' +e.text+'</a>';
    },

    'default': function(e) {
        return '{ENTITY}';
    }
};

// processes entities for the given message and entity object
var process_entities = function(message, entities) {
    // short-circuit failure mode
    if(typeof entities === 'undefined') {
        return message;
    }

    // build list of entities sorted on starting index
    var es = [];

    $.each(entities, function(t, ts) {
        $.each(ts, function(_, e) {
            e['type'] = t;
            es.push(e);
        });
    });

    es.sort(function(a,b) {
        return a['indices'][0] - b['indices'][0];
    });

    // process entities one-by-one in order of appearance
    var marker = 0;
    var result = "";
    for(var i in es) {
        var e = es[i];
        var start = e['indices'][0];
        var stop = e['indices'][1];

        //copy string content
        result += message.substring(marker, start);

        //process entity (through formatter or no-op function)
        var formatter = entity_formatters[e.type]
                        || function(e) { return message.substring(start,stop) };
        result += formatter(e);

        // update marker location
        marker = stop;
    }

    // append tail of message
    result += message.substring(marker, message.length);

    return result;
}


/**
 * This block function is adapted to our needs.
 * For readability, all DOM modifications are done with jQuery. I know
 * this is not the most efficient way (keeping performance in mind), but
 * the loss in performance is acceptable.
 */
block.fn.tweets = function(config) {
    var options = $.extend({
        memory: 20,
        debug: false
    }, config);
    
    var $list = this.$element.append('<div class=""></div>').find('div');

    var t = this;
    // register default handler for handling tweet data
    this.actions(function(e, tweet){
        
        // if debug: see how many tweets come by in each category.
        ii[t.$element.attr('id')] += 1;
        if (options.debug) console.log(ii);
        
        // Prepare some textual values.
            // Time: if the difference is less than 24 hours, just display the time.
		var date = new Date(tweet.created_at);
		if (Date.now() - date > new Date(0000,00,01) ){
            var time = ('0' + date.getHours()).slice(-2) + ':' + 
                       ('0' + date.getMinutes()).slice(-2) + ' op ' + 
                        date.getDate() + ' ' + 
                        monthName[date.getMonth()] + ' ' + 
                        date.getFullYear();
		} else {
            var time = ('0' + date.getHours()).slice(-2) + ':' + 
                       ('0' + date.getMinutes()).slice(-2) + ' uur';
		}
        var $time = $('<small />').addClass('time')
                                  .append($('<span />').text(time))
            // The tweet text.
        var tweettext = process_entities(tweet.text, tweet.entities);
        
        // Build account information.
        var $account = $('<a />').addClass('account-group')
                                 .attr({
                                    'target':'_blank',
                                    'href':  'http://twitter.com/'+tweet.user.screen_name
                                  })
                                 .append(
                                    $('<span />').addClass('name')
                                                 .text(tweet.user.name))
                                 .append(
                                    $('<span />').addClass('username')
                                                 .text('@'+tweet.user.screen_name));
        
        // Build tweet
        var $tweet = $('<div />').addClass('tweet')
                                 .append(
                                      $('<div />').addClass('content')
                                                   // header (account info + time)
                                                   .append(
                                                        $('<div />').addClass('stream-item-header')
                                                                    .append($account))
                                                                    .append($('<br />'))
                                                                    .append($time)
                                                   // tweet
                                                   .append(
                                                        $('<p />').addClass('text')
                                                                  .html(tweettext)));


        // Build the different structures of the item.
		var $itemleft = $('<div />').addClass('col-xs-2')
                                    .append(
                                        $('<img>').addClass('avatar')
                                                  .attr('src', tweet.user.profile_image_url));
		var $itemright = $('<div />').addClass('col-xs-10')
                                     .append($tweet);
		var $itembottom = $('<div />').addClass('col-xs-10')
                                      .addClass('functiebalk')
                                      .data('username', tweet.user.screen_name)
                                      .append('<span id="savebutton" class="glyphicon glyphicon-floppy-disk"></span><span id="retweetbutton" class="glyphicon glyphicon-retweet"></span><span id="replybutton" class="glyphicon glyphicon-arrow-left"></span>');
        
        // Build the outer structure of the item.
        var $item = $('<li />').addClass('row')
                               .addClass('tweet')
                               .addClass('list-group-item')
                               .append($itemleft)
                               .append($itemright)
                               .append($itembottom);
        
        // place new tweet in front of list 
        $list.prepend($item);

        // remove stale tweets
        if ($list.children().size() > options.memory) {
            $list.children().last().remove();
        }
    });

    return this.$element;
};
})(jQuery, block);
