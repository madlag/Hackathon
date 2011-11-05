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
@end

@implementation UploadController

-(id)initWithChannelId:(NSString *)anId {
    if ((self = [super init])) {
        // Save the channel ID
        channelId = [anId retain];
        pictureQueue = [[NSMutableArray alloc] initWithCapacity:10];
    }
    
    return self;
}

-(void)dealloc {
    [channelId release];
    [pictureQueue release];
    [super dealloc];
}

-(void)addPictureToUpload:(UIImage *)picture {
    
    // Resize the picture
    CGSize newSize = picture.size.width > picture.size.height ? CGSizeMake(PICTURE_LARGE_SIDE, PICTURE_SMALL_SIDE) : CGSizeMake(PICTURE_SMALL_SIDE, PICTURE_LARGE_SIDE);
    UIImage *resizedPicture = [picture imageByScalingProportionallyToSize:newSize];
    
    // Add the picture to the queue
    [pictureQueue addObject:UIImageJPEGRepresentation(resizedPicture, PICTURE_COMPRESSION)];
    
    // If there was no picture before, we start the upload now
    if ([pictureQueue count] == 1) {
        [self checkQueue];
    }
}

-(void)checkQueue {
    if ([pictureQueue count] > 0) {
        // Build the upload URL
        NSString *stringUrl = [NSString stringWithFormat:@"%@%@", SERVER_URL, UPLOAD_SERVICE];
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
    NSString *stringUrl = [NSString stringWithFormat:@"%@%@", SERVER_URL, PUSH_SERVICE];
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
    }
    
    [self checkQueue];
}

-(void)requestFailed:(ASIHTTPRequest *)request {
    NSLog(@"Request failed - Error: %@", request.error.localizedDescription);
    [self checkQueue];
}

@end
