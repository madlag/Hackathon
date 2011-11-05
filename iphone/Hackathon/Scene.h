//
//  Scene.h
//  Hackathon
//
//  Created by Stephane JAIS on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface Scene : NSObject  {
    NSString *sceneId;
    NSString *name;
    NSInteger numPhotos;
    UIDeviceOrientation orientation;
    NSString *desc;
}

@property (nonatomic, retain) NSString *sceneId;
@property (nonatomic, retain) NSString *name;
@property (nonatomic, assign) NSInteger numPhotos;
@property (nonatomic, assign) UIDeviceOrientation orientation;
@property (nonatomic, retain) NSString *desc;


- (NSDictionary*) dict;
+ (Scene*) fromDict:(NSDictionary *)dict;


@end
