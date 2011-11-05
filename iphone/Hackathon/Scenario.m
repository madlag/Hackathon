//
//  Scenario.m
//  Hackathon
//
//  Created by Stephane JAIS on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import "Scenario.h"

static NSMutableDictionary* _data = nil;

@implementation Scenario(Private)

+ (NSMutableDictionary*) getData {
    if (nil == _data) {
        _data = [NSMutableDictionary dictionaryWithContentsOfFile:[self savePath]];
        if (nil == _data)
            _data = [[NSMutableDictionary alloc] init];
    }
    return _data;
}

+ (void) save {
    [[self getData] writeToFile:[self savePath] atomically:YES];
}

- (NSDictionary*) dict {
    NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithCapacity:2];
    [dict setObject:self.code forKey:@"code"];
    [dict setObject:self.name forKey:@"name"];
    return [NSDictionary dictionaryWithDictionary:dict];
}

@end

@implementation Scenario
@synthesize code, name;

- (void)save {
    [[Scenario getData] setObject:[self dict] forKey:self.code];
    [Scenario save];
}

+ (NSString*) savePath {
    NSString * bundlePath = [[NSBundle mainBundle] bundlePath];
    return [bundlePath stringByAppendingPathComponent:@"scenario.plist"];
}

+ (NSArray*) getAll {
    NSDictionary *data = [Scenario getData];
    NSMutableArray *result = [NSMutableArray arrayWithCapacity:[data count]];
    NSEnumerator *enumerator = [data keyEnumerator];
    NSString *key;
    while (key = [enumerator nextObject]) {
        NSDictionary *d = [data objectForKey:key];
        Scenario *s = [[[Scenario alloc] init] autorelease];
        s.code = [d objectForKey:@"code"];
        s.name = [d objectForKey:@"name"];
        [result addObject:s];
    }
    return [NSArray arrayWithArray:result];
}

@end
