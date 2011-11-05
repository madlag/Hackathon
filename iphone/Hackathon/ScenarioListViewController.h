//
//  ScenarioListViewController.h
//  Hackathon
//
//  Created by Stephane JAIS on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "CodeInputViewController.h"

@interface ScenarioListViewController : UITableViewController <CodeInputViewControllerDelegate> {
    NSArray *scenarii;
}

@property (atomic, retain) NSArray *scenarii;

- (void)onAdd:(id)sender;

@end
