//
//  Scenario.h
//  Hackathon
//
//  Created by Stephane JAIS on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface Scenario : NSObject {
    NSString *code;
    NSString *name;
}

@property (nonatomic, retain) NSString *code;
@property (nonatomic, retain) NSString *name;

- (void) save;
+ (NSString*) savePath;
+ (NSArray*) getAll;

@end
