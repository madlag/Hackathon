//
//  UploadController.h
//  Hackathon
//
//  Created by Alexis Taugeron on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ASIHTTPRequest.h"

@interface UploadController : NSObject <ASIHTTPRequestDelegate> {
    NSString *channelId;
    NSMutableArray *pictureQueue;
    NSString *serverUrl;
}

@property (nonatomic, retain) NSString *channelId;

-(void)addPictureToUpload:(UIImage *)picture;
-(void)checkQueue;

@end