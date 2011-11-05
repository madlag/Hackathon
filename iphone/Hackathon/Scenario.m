//
//  Scenario.m
//  Hackathon
//
//  Created by Stephane JAIS on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import "Scenario.h"
#import "Scene.h"

static NSMutableDictionary* _data = nil;

@implementation Scenario(Private)

+ (NSMutableDictionary*) getData {
    if (nil == _data) {
        _data = [[NSMutableDictionary dictionaryWithContentsOfFile:[self savePath]] retain];
        if (nil == _data)
            _data = [[NSMutableDictionary alloc] init];
    }
    return _data;
}

+ (void) save {
    [[Scenario getData] writeToFile:[self savePath] atomically:YES];
}

- (NSDictionary*) dict {
    NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithCapacity:2];
    [dict setObject:self.code forKey:@"code"];
    [dict setObject:self.name forKey:@"name"];
    
    NSMutableArray *sceneDicts = [NSMutableArray arrayWithCapacity:[self.scenes count]];
    NSEnumerator *e = [self.scenes objectEnumerator];
    Scene *scene;
    while (scene = [e nextObject]) {
        [sceneDicts addObject:[scene dict]];
    }
    [dict setObject:[NSArray arrayWithArray:sceneDicts] forKey:@"scenes"];
    return [NSDictionary dictionaryWithDictionary:dict];
}

@end

@implementation Scenario
@synthesize code, name, scenes;

- (void)save {
    NSMutableDictionary *data = [Scenario getData];
    [data setObject:[self dict] forKey:self.code];
    [Scenario save];
}

+ (NSString*) savePath {
    NSString * bundlePath = [[NSBundle mainBundle] bundlePath];
    return [bundlePath stringByAppendingPathComponent:@"scenario.plist"];
}

+ (Scenario*) fromDict:(NSDictionary*)d {
    Scenario *s = [[[Scenario alloc] init] autorelease];
    s.code = [NSString stringWithFormat:@"%@", [d objectForKey:@"code"]];
    s.name = [NSString stringWithFormat:@"%@", [d objectForKey:@"name"]];
    NSArray *sceneDicts = [d objectForKey:@"scenes"];
    if (nil != sceneDicts) {
        NSMutableArray *scenes = [NSMutableArray arrayWithCapacity:[sceneDicts count]];
        NSDictionary *sceneDict;
        NSEnumerator *e = [sceneDicts objectEnumerator];
        while (sceneDict = [e nextObject]) {
            [scenes addObject:[Scene fromDict:sceneDict]];
        }
        s.scenes = [NSArray arrayWithArray:scenes];
    }
    return s;
}

+ (NSArray*) getAll {
    NSDictionary *data = [Scenario getData];
    NSMutableArray *result = [NSMutableArray arrayWithCapacity:[data count]];
    NSEnumerator *enumerator = [data keyEnumerator];
    NSString *key;
    while (key = [enumerator nextObject]) {
        NSDictionary *d = [data objectForKey:key];
        Scenario *s = [Scenario fromDict:d];
        [result addObject:s];
    }
    return [NSArray arrayWithArray:result];
}

@end
