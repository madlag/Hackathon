//
//  UploadController.m
//  Hackathon
//
//  Created by Alexis Taugeron on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import "UploadController.h"
#import "UIImageExtensions.h"
#import "Constants.h"
#import "SBJson.h"

@interface UploadController()
-(void)onPictureUploaded:(ASIHTTPRequest *)request;
-(void)onPushDone:(ASIHTTPRequest *)request;
-(void)saveQueue;
@end

@implementation UploadController

-(id)init {
    if ((self = [super init])) {
        // Set the server URL
        serverUrl = SERVER_URL;
        
        // Get the saved code if possible
        channelId = [[[NSUserDefaults standardUserDefaults] stringForKey:@"code"] retain];
        
        // Get the saved queues or create a new map
        pictureQueue = (NSMutableArray *)[[NSUserDefaults standardUserDefaults] objectForKey:@"pictureQueue"];
        if (!pictureQueue || !channelId || [channelId length] == 0) {
            pictureQueue = [[NSMutableArray alloc] initWithCapacity:10];
        }
        [self checkQueue];
    }
    
    return self;
}

-(void)dealloc {
    [channelId release];
    [pictureQueue release];
    [serverUrl release];
    [super dealloc];
}

#pragma mark - Accessors

- (NSString *)channelId
{
    return channelId;
}

- (void)setChannelId:(NSString *)anId
{
    if (![channelId isEqualToString:anId]) {
        [pictureQueue removeAllObjects];
        [self saveQueue];
    }
    channelId = [anId retain];
}

#pragma mark - Queue management

-(void)addPictureToUpload:(UIImage *)picture {
    
    // Resize the picture
    CGSize newSize = picture.size.width > picture.size.height ? CGSizeMake(PICTURE_LARGE_SIDE, PICTURE_SMALL_SIDE) : CGSizeMake(PICTURE_SMALL_SIDE, PICTURE_LARGE_SIDE);
    UIImage *resizedPicture = [picture imageByScalingProportionallyToSize:newSize];
    
    // Add the picture to the queue and save the queue
    [pictureQueue addObject:UIImageJPEGRepresentation(resizedPicture, PICTURE_COMPRESSION)];
    [self saveQueue];
    
    // If there was no picture before, we start the upload now
    if ([pictureQueue count] == 1) {
        [self checkQueue];
    }
}

-(void)checkQueue {
    if ([pictureQueue count] > 0) {
        // Build the upload URL
        NSString *stringUrl = [NSString stringWithFormat:@"%@%@", serverUrl, UPLOAD_SERVICE];
        NSURL *url = [NSURL URLWithString:stringUrl];
        
        // Build the upload request and start it
        ASIHTTPRequest *uploadRequest = [ASIHTTPRequest requestWithURL:url];
        [uploadRequest setDelegate:self];
        [uploadRequest setDidFinishSelector:@selector(onPictureUploaded:)];
        [uploadRequest setRequestMethod:@"POST"];
        [uploadRequest addRequestHeader:@"Content-Type" value:@"image/jpeg"];
        [uploadRequest appendPostData:[pictureQueue objectAtIndex:0]];
        [uploadRequest startAsynchronous];
    }
}

-(void)onPictureUploaded:(ASIHTTPRequest *)request {
    NSLog(@"Picture uploaded - %i pictures left", [pictureQueue count]);
    // Parse the result
    SBJsonParser *parser = [[SBJsonParser alloc] init];
    NSDictionary *pictureDict = [parser objectWithString:[request responseString]];
    
    // Build the push request data
    NSMutableDictionary *requestDict = [NSMutableDictionary dictionaryWithCapacity:2];
    [requestDict setObject:@"producer_push" forKey:@"type"];
    NSMutableDictionary *value = [NSMutableDictionary dictionaryWithCapacity:3];
    [value setObject:channelId forKey:@"channelId"];
    [value setObject:@"myUniqueId" forKey:@"producerId"];
    [value setObject:[pictureDict objectForKey:@"file_url"] forKey:@"url"];
    [requestDict setObject:value forKey:@"value"];
    SBJsonWriter *jsonWriter = [[SBJsonWriter alloc] init];
    NSData *requestData = [jsonWriter dataWithObject:requestDict];
    
    // Build the push url
    NSString *stringUrl = [NSString stringWithFormat:@"%@%@", serverUrl, PUSH_SERVICE];
    NSURL *url = [NSURL URLWithString:stringUrl];
    
    // Build the push request and start it
    ASIHTTPRequest *pushRequest = [ASIHTTPRequest requestWithURL:url];
    [pushRequest appendPostData:requestData];
    [pushRequest setRequestMethod:@"POST"];
    [pushRequest setDelegate:self];
    [pushRequest setDidFinishSelector:@selector(onPushDone:)];
    [pushRequest startAsynchronous]; 
}

-(void)onPushDone:(ASIHTTPRequest *)request {
    NSLog(@"Server push done");
    
    if ([pictureQueue count] > 0) {
        [pictureQueue removeObjectAtIndex:0];
        [self saveQueue];
    }
    
    [self checkQueue];
}

-(void)requestFailed:(ASIHTTPRequest *)request {
    NSLog(@"Request failed - Error: %@", request.error.localizedDescription);
    [self checkQueue];
}

-(void)saveQueue
{
    [[NSUserDefaults standardUserDefaults] setObject:pictureQueue forKey:@"pictureQueue"];
}

@end
