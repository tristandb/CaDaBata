from eca import *
from eca.generators import start_offline_tweets

import datetime



@event('init')
def setup(ctx, e):
    '''The code that will be executed at initialization: starting the offline tweet stream.'''
    start_offline_tweets('cadabata_static/batatweets.txt', 'tweet', time_factor=100000, arff_file='classifiers/bata_2014_classifier.arff')
    

@event('tweet')
def tweet(ctx, e):
    '''The code that will be excecuted when a tweet is received.'''
    # The tweet data.
    tweet = e.data

    # Rename the classification of the tweet.
    tweetclass = classify_tweet(tweet['extra']['class_predicted_by: NaiveBayes']); 
    
    # Parse the time and date of the tweet. This has to be done with '{}'.format(), otherwise
    #  it can't be JSON encoded.
    time = '{}'.format(datetime.datetime.strptime(tweet['created_at'], '%a %b %d %H:%M:%S %z %Y'))
    
    # Print to the console, so we know something is happening.
    print('Tweet classified (and emitted) as:',tweetclass)
    
    # Emit to the right handler.
    emit('tweet_'+tweetclass, e.data)
    # Emit to the graph.
    emit('tweet_flot', {
        'action': 'add',
        'series': tweetclass,
        'time': time,
        'value': 1
    });
    
    
    
def classify_tweet(cls):
    '''Rename the classifications according to cls. Default is neutral.'''
    o = 'neutral'
    
    if cls == 'T':
        o = 'positive'
    elif cls == 'N':
        o = 'neutral'
    elif cls == 'F':
        o = 'negative'
    elif cls == 'A':
        o = 'alert'

    return o
