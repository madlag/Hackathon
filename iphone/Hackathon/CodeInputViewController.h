//
//  CodeInputViewController.h
//  Hackathon
//
//  Created by Stephane JAIS on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ASIHTTPRequest.h"
#import "Scenario.h"

@protocol CodeInputViewControllerDelegate;
@interface CodeInputViewController : UIViewController <ASIHTTPRequestDelegate, UITextFieldDelegate, UIImagePickerControllerDelegate> {
    UIBarButtonItem *cancelButton;
    UIBarButtonItem *saveButton;
    UITextField *textField;
    BOOL showCancel;
    UIView *spinner;
    id<CodeInputViewControllerDelegate> delegate;
    ASIHTTPRequest *request;
    NSString *channelId;
}

@property (nonatomic, retain) IBOutlet UIBarButtonItem *cancelButton;
@property (nonatomic, assign) IBOutlet UIBarButtonItem *saveButton;
@property (nonatomic, assign) IBOutlet UITextField *textField;
@property (nonatomic, assign) IBOutlet UIView *spinner;
@property (nonatomic, assign) id<CodeInputViewControllerDelegate> delegate;
@property (nonatomic, retain) ASIHTTPRequest *request;

- (void)setShowCancel:(BOOL)show;
- (void)onSave:(id)sender;
- (void)onCancel:(id)sender;
@end


@protocol CodeInputViewControllerDelegate <NSObject>
- (void) codeInputViewController:(CodeInputViewController*)c
                doneWithScenario:(Scenario*)s;
@end