from eca import *
from eca.generators import start_offline_tweets

import datetime
import textwrap
import random

@event('init')
def setup(ctx, e):
    # start the offline tweet stream
    start_offline_tweets('test_static/bata_2014.txt', 'tweet', time_factor=100000)
    ctx.count = 0
    fire('sample', {'previous': 0.0})

@event('tweet')
def tweet(ctx, e):
    # we receive a tweet
    tweet = e.data

    # parse date
    time = datetime.datetime.strptime(tweet['created_at'], '%a %b %d %H:%M:%S %z %Y')

    # nicify text
    text = textwrap.fill(tweet['text'],initial_indent='    ', subsequent_indent='    ')

    # generate output
    output = "[{}] {} (@{}):\n{}".format(time, tweet['user']['name'], tweet['user']['screen_name'], text)
    #emit('tweet', output)
    
    tweetclass = classify_tweet(e)
    
    emit('tweet_'+tweetclass, e.data)
    
    
    
def classify_tweet(e):

    return 'negative'


@event('sample')
def generate_sample(ctx, e):
    ctx.count += 1
    if ctx.count % 50 == 0:
        emit('debug', {'text': 'Log message #'+str(ctx.count)+'!'})

    # base sample on previous one
    sample = e.data['previous'] + random.uniform(+5.0, -5.0)

    # emit to outside world
    emit('sample',{
        'action': 'add',
        'value': sample
    })

    # chain event
    fire('sample', {'previous': sample}, delay=0.5)