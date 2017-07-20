# FriendFacts

FriendFacts is a dumb Alexa skill that spews messages about names.

I can say "Alexa, ask FriendFacts about George." And Alexa might say, "George's
first job was tossing luggage at Logan Airport."

All the messages are written by the administrator(s) of a particular FriendFacts
deployment.

Personally, I use this for disparaging humor about myself and everyone who hangs
out in my living room. But you could theoretically write wholesome, helpful
FriendFacts as well.

## Components

FriendFacts has three components:

1. An Alexa Skill (using the Alexa Skills Kit)

2. AWS Lambda Function (NodeJS)

3. AWS DynamoDB Table (contains the actual content)

## Deployment and Configuration

TODO make FriendFacts actually deployable (add example data, Intent schema, etc)

## Testing

I decided that the only thing dumber than creating FriendFacts, was taking the
time to write unit tests for FriendFacts.

In all seriousness though, I may write tests at some point in order to gain
familiarity with NodeJS unit testing and serverless integration testing.  It is
my belief that if you build functionality without tests, then you haven't
actually built any functionality.

## Future Improvements

I stopped early on this because it was "good enough" and I had other
side-projects at various levels of dumbness. If I were to keep working on it,
here's what I would add:

1. Users can add additional FriendFacts
 - Currently, I write all the FriendFacts directly in DynamoDB
 - I would like the other people who hang out in my living room to add their own
 
2. Users can associate additional name pronunciations
 - For example, if Alexa thinks I said "worry", which doesn't match any name
   pronunciations, then she should ask "I don't know worry. Did you mean Uri?"
   Then, if the user says yes, then "worry" becomes associated as a valid
   pronunciation of Uri, and Alexa says a FriendFact.
  
3. Messages are picked logarithmically
 - Currently, for a given name, every message besides the most recently said
   message has an equal chance of getting picked. The result is that sometimes,
   a message will go a long time without being said. Instead, we should pick
   the messages based on a logarithmic distribution of probability, and then
   place the picked message at the back of the list. This means a message that
   hasn't been said in a while has a better chance of being said
   
4. Re-Factor nested callbacks to use "Promise" interface
 - After writing FriendFacts, I talked to some people who actually know Node.
   Apparently, to make Node "feel" like a synchronous framework, I should use
   the "promise" interface to chain callbacks and handle errors.

 
