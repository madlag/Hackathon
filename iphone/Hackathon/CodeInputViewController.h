//
//  CodeInputViewController.h
//  Hackathon
//
//  Created by Stephane JAIS on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ASIHTTPRequest.h"

@protocol CodeInputViewControllerDelegate <NSObject>
-(void)onEnterCode:(NSString *)code;
@end

@interface CodeInputViewController : UIViewController <UITextFieldDelegate> {
    UITextField *textField;
    id<CodeInputViewControllerDelegate> delegate;
}

@property (nonatomic, assign) id<CodeInputViewControllerDelegate> delegate;
@property (nonatomic, assign) IBOutlet UITextField *textField;

@end