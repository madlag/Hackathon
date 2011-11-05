//
//  Scene.m
//  Hackathon
//
//  Created by Stephane JAIS on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import "Scene.h"

@implementation Scene
@synthesize sceneId, name, desc, numPhotos, orientation;
- (NSDictionary*) dict {
    NSMutableDictionary *dict = [[[NSMutableDictionary alloc] init]autorelease];
    [dict setObject:self.sceneId forKey:@"id"];
    [dict setObject:self.name forKey:@"name"];
    [dict setObject:self.desc forKey:@"description"];
    [dict setObject:[NSString stringWithFormat:@"%i", self.numPhotos] forKey:@"numPhotos"];
    [dict setObject:[NSString stringWithFormat:@"%i", self.orientation] forKey:@"orientation"];
    return [NSDictionary dictionaryWithDictionary:dict];
}


+ (Scene*) fromDict:(NSDictionary *)dict {
    Scene *scene = [[[Scene alloc] init] autorelease];
    scene.sceneId = [NSString stringWithFormat:@"%@", [dict objectForKey:@"id"]];
    scene.name = [dict objectForKey:@"name"];
    scene.desc = [dict objectForKey:@"description"];
    
    NSString *orientation  = [dict objectForKey:@"orientation"];
    scene.orientation = [orientation isEqualToString:@"portrait"] ? UIDeviceOrientationPortrait : UIDeviceOrientationLandscapeLeft;
    scene.numPhotos = [[dict objectForKey:@"numPhotos"] intValue];
    return scene;
}

- (void)dealloc {
    [sceneId release];
    [name release];
    [desc release];
    [super dealloc];
}
@end
