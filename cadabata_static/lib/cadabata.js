$(document).ready(function () {

    // Initialize local storage if it is empty 
    if (typeof localStorage.tweets_negative === 'undefined') {
        localStorage.setItem('tweets_negative', JSON.stringify([]));
    }
    if (typeof localStorage.tweets_alert === 'undefined') {
        localStorage.setItem('tweets_alert', JSON.stringify([]));
    }
    if (typeof localStorage.tweets_positive === 'undefined') {
        localStorage.setItem('tweets_positive', JSON.stringify([]));
    }
    
    // Initialize tabs
    $( '#tabs' ).tabs();
    
    // Reply to a tweet (opens new window)
    $( document ).on('click', '#replybutton', function() {
        var username = $(this).parent().data('username');
        twitterpopup('https://twitter.com/intent/tweet?screen_name='+ username);
    });
    
    // Retweet a tweet (opens new window)
    $( document ).on('click', '#retweetbutton', function() {
        var username = $(this).parent().data('username');
        var tweet = $(this).parent().parent().find('.tweet .text').text();
        var tweetencoding = encodeURIComponent(tweet);
        twitterpopup('https://twitter.com/intent/tweet?text=RT @'+ username+' '+tweetencoding);
    });
                    
    // Saving a tweet to local storage
    $( document ).on('click', '#savebutton', function() {						
        SaveDataToLocalStorage('<li class="row tweet list-group-item">'+$(this).parent().parent().html()+'</div>', $(this).parent().parent().parent().parent().attr('id'));
    });
    
    // On click on #changesize (changes the size of Flot)
    $('#changesize').click(function(){
        $(this).parent().parent().find('.jumbotron').toggleClass('bigger');
    });

    // Tabs click
    $('#tabs ul li').click(function(){		
        
        if(!$(this).hasClass('active')){
            // Switches clicked tab
            $($(this).parent().find('li')).toggleClass('active');
            $(this).parent().parent().children('div').toggleClass('display-none');
        }
        

        // Copy local storage to tabs
        $($(this).parent().parent().find('#negatief_saved')).html(JSON.parse(localStorage.getItem('tweets_negative')));
        $($(this).parent().parent().find('#alert_saved')).html(JSON.parse(localStorage.getItem('tweets_alert')));
        $($(this).parent().parent().find('#positive_saved')).html(JSON.parse(localStorage.getItem('tweets_positive')));
    });
    
    // Saves data to local storage (local storage name == id)
    function SaveDataToLocalStorage(data, id)
    {
        var a = [];
        a = JSON.parse(localStorage.getItem(id));					
        a.unshift(data);					
        localStorage.setItem(id, JSON.stringify(a));
    }
    
    // Open a popup with height = 300px, width = 600px and url == url
    function twitterpopup(url) {
        newwindow = window.open(url,'Twitter','height=300,width=600');
        if (window.focus) {newwindow.focus()}
        return false;
    }
    
    // Enable Flot resizing
    $('#flot0').resizable({
        maxWidth: 1200,
        maxHeight: 500,
        minWidth: 450,
        minHeight: 250
    });
    
});