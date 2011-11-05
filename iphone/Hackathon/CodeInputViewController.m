//
//  CodeInputViewController.m
//  Hackathon
//
//  Created by Stephane JAIS on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import "CodeInputViewController.h"
#import "SBJson.h"
#import "UIImageExtensions.h"

@interface CodeInputViewController()
-(void)onPictureUploaded:(ASIHTTPRequest *)r;
-(void)onPushDone:(ASIHTTPRequest *)r;
@end

@implementation CodeInputViewController
@synthesize saveButton, cancelButton, textField, spinner, delegate, request;

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)didReceiveMemoryWarning
{
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
}

- (void)dealloc {
    [cancelButton release];
    [request release];
    [super dealloc];
}

#pragma mark - View lifecycle

- (void)viewDidLoad
{
    [super viewDidLoad];
    
    [self.textField becomeFirstResponder];
    
    // Set toolbar items
    self.saveButton = [[[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemSave target:self action:@selector(onSave:)] autorelease];
    self.cancelButton = [[[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemCancel target:self action:@selector(onCancel:)] autorelease];

    if (showCancel) {
        [self.navigationItem setLeftBarButtonItem:self.cancelButton];
    }
    
    [self.navigationItem setRightBarButtonItem:self.saveButton];
    
    // Set ourselves as text field delegate
    [self.textField setDelegate:self];

    // Title
    [self.navigationItem setTitle:NSLocalizedString(@"Enter Code", nil)];

    // Do any additional setup after loading the view from its nib.
}

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    // Return YES for supported orientations
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}

- (void)setShowCancel:(BOOL)show {
    showCancel = show;
}

- (void)onCancel:(id)sender {
    if (nil != self.request) {
        [self.request cancel];
        self.request = nil;
    } else {
        [self dismissModalViewControllerAnimated:YES];
    }
}

- (void)onSave:(id)sender {
    channelId = [[self.textField text] stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];  
    NSMutableDictionary *requestDict = [NSMutableDictionary dictionaryWithCapacity:2];
    [requestDict setObject:@"producer_connect" forKey:@"type"];
    
    NSMutableDictionary *value = [NSMutableDictionary dictionaryWithCapacity:2];
    [value setObject:channelId forKey:@"channelId"];
    [value setObject:@"myUniqueId" forKey:@"producerId"];
    
    [requestDict setObject:value forKey:@"value"];
    
    SBJsonWriter *jsonWriter = [[SBJsonWriter alloc] init];
    NSData *requestData = [jsonWriter dataWithObject:requestDict];
    
    NSURL *url = [NSURL URLWithString:@"http://192.168.0.75:7000/iosclient/"];
    self.request = [ASIHTTPRequest requestWithURL:url];
    [self.request appendPostData:requestData];
    [self.request setRequestMethod:@"POST"];
    [self.request setDelegate:self];
    [self.request startAsynchronous]; 

    [self.spinner setHidden:NO];
    [self.saveButton setEnabled:NO];
    [self.navigationItem setLeftBarButtonItem:self.cancelButton];
}

#pragma mark ASI request delegate

- (void)requestFinished:(ASIHTTPRequest *)r {
    [self.spinner setHidden:YES];
    [self.saveButton setEnabled:YES];
    if (!showCancel)
        [self.navigationItem setLeftBarButtonItem:nil];

    SBJsonParser *parser = [[[SBJsonParser alloc] init] autorelease];
    NSLog(@"Response: %@", [r responseString]);
    NSError *error = nil;
    NSDictionary  *d = [parser objectWithString:[r responseString] error:&error];
    self.request = nil;
    if (nil != d) {
        Scenario *s = [[Scenario fromDict:d] retain];
        if (nil != self.delegate)
            [self.delegate codeInputViewController:self doneWithScenario:s];
        [s release];
        //[self dismissModalViewControllerAnimated:YES];
        
        
        // TEMPORARY
        UIImagePickerController *imagePicker = [[UIImagePickerController alloc] init];
        imagePicker.sourceType = UIImagePickerControllerSourceTypeCamera;
        imagePicker.delegate = self;
        [self presentModalViewController:imagePicker animated:YES];
        [imagePicker release];
        // TEMPORARY
        
        
    } else {
        NSLog(@"Could not parse JSON: %@", [error localizedDescription]);
    }
}

- (void)requestFailed:(ASIHTTPRequest *)r {
    NSLog(@"Request failed: %@", [[r error] localizedDescription]);
    [self.spinner setHidden:YES];
    [self.saveButton setEnabled:YES];
    self.request = nil;
    if (!showCancel)
        [self.navigationItem setLeftBarButtonItem:nil];
}

#pragma mark UITextField delegate

- (BOOL)textField:(UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string {
    return self.request == nil;
}



- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary *)info {
    NSURL *url = [NSURL URLWithString:@"http://st2.stupeflix.com/upload/"];
    ASIHTTPRequest *uploadRequest = [ASIHTTPRequest requestWithURL:url];
    [uploadRequest setDelegate:self];
    [uploadRequest setDidFinishSelector:@selector(onPictureUploaded:)];
    [uploadRequest setRequestMethod:@"POST"];
    [uploadRequest addRequestHeader:@"Content-Type" value:@"image/jpeg"];
    UIImage *picture = (UIImage *)[info objectForKey:UIImagePickerControllerOriginalImage];
    CGSize targetSize = CGSizeMake(320, 480);
    UIImage *scaledPicture = [picture imageByScalingProportionallyToSize:targetSize];
    [uploadRequest appendPostData:UIImageJPEGRepresentation(scaledPicture, 1.0)];
    [uploadRequest startAsynchronous];
}

-(void)onPictureUploaded:(ASIHTTPRequest *)r {
    SBJsonParser *parser = [[SBJsonParser alloc] init];
    NSDictionary *pictureDict = [parser objectWithString:[r responseString]];
    
    NSMutableDictionary *requestDict = [NSMutableDictionary dictionaryWithCapacity:2];
    [requestDict setObject:@"producer_push" forKey:@"type"];
    
    NSMutableDictionary *value = [NSMutableDictionary dictionaryWithCapacity:3];
    [value setObject:channelId forKey:@"channelId"];
    [value setObject:@"myUniqueId" forKey:@"producerId"];
    [value setObject:[pictureDict objectForKey:@"file_url"] forKey:@"url"];
    
    [requestDict setObject:value forKey:@"value"];
    
    SBJsonWriter *jsonWriter = [[SBJsonWriter alloc] init];
    NSData *requestData = [jsonWriter dataWithObject:requestDict];
    
    NSURL *url = [NSURL URLWithString:@"http://192.168.0.75:7000/iosclient/"];
    ASIHTTPRequest *pushRequest = [ASIHTTPRequest requestWithURL:url];
    [pushRequest appendPostData:requestData];
    [pushRequest setRequestMethod:@"POST"];
    [pushRequest setDelegate:self];
    [pushRequest setDidFinishSelector:@selector(onPushDone:)];
    [pushRequest startAsynchronous]; 
}

-(void)onPushDone:(ASIHTTPRequest *)r {
    NSLog(@"%@", [r responseString]);
}

@end
