//
//  ScenarioListViewController.m
//  Hackathon
//
//  Created by Stephane JAIS on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//
/*
#import "ScenarioListViewController.h"
#import "ScenarioViewController.h"
#import "StepViewController.h"
#import "Scenario.h"

@interface ScenarioListViewController()
-(void)addCode:(BOOL)showCancel;
@end

@implementation ScenarioListViewController
@synthesize scenarii;

- (id)initWithStyle:(UITableViewStyle)style
{
    self = [super initWithStyle:style];
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

- (void) dealloc {
    [scenarii release];
    [super dealloc];
}
#pragma mark - View lifecycle

- (void)viewDidLoad
{
    [super viewDidLoad];

    self.scenarii = [Scenario getAll];
    
    // Configure navigation item
    self.navigationItem.title = NSLocalizedString(@"Scenarii", nil);
    self.navigationItem.rightBarButtonItem = [[[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemAdd target:self action:@selector(onAdd:)] autorelease];
    
    // First time user: no scenario
    if (0 == [scenarii count]) {
        [self addCode:NO];
    }
    
    // Uncomment the following line to preserve selection between presentations.
    // self.clearsSelectionOnViewWillAppear = NO;
 
    // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
    // self.navigationItem.rightBarButtonItem = self.editButtonItem;
}

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
}

- (void)viewDidAppear:(BOOL)animated
{
    [super viewDidAppear:animated];
}

- (void)viewWillDisappear:(BOOL)animated
{
    [super viewWillDisappear:animated];
}

- (void)viewDidDisappear:(BOOL)animated
{
    [super viewDidDisappear:animated];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    // Return YES for supported orientations
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Return the number of sections.
    return 0 == [scenarii count] ? 0 : 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    // Return the number of rows in the section.
    return [scenarii count];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *CellIdentifier = @"Cell";
    
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:CellIdentifier];
    if (cell == nil) {
        cell = [[[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:CellIdentifier] autorelease];
        cell.accessoryType = UITableViewCellAccessoryDisclosureIndicator;
    }
    
    // Configure the cell...
    Scenario *s = (Scenario *)[scenarii objectAtIndex:[indexPath row]];
    cell.textLabel.text = s.name;
    
    return cell;
}



#pragma mark - Table view delegate

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    StepViewController *stepVC = [[StepViewController alloc] initWithNibName:@"StepViewController" bundle:nil];
    [self.navigationController pushViewController:stepVC animated:YES];
    [stepVC release];
}

#pragma mark - Code Input

-(void)addCode:(BOOL)showCancel {
    CodeInputViewController *codeInput = [[CodeInputViewController alloc] initWithNibName:@"CodeInputViewController" bundle:nil];
    [codeInput setShowCancel:showCancel];
    codeInput.delegate = self;
    UINavigationController *nav = [[UINavigationController alloc] initWithRootViewController:codeInput];
    [self presentModalViewController:nav animated:NO];
    [codeInput release];
    [nav release];
}

- (void)codeInputViewController:(CodeInputViewController *)c doneWithScenario:(Scenario *)s {
    
    //[s save];
    //self.scenarii = [Scenario getAll];
    //[self.tableView reloadData];
    
}

- (void)onAdd:(id)sender {
    [self addCode:YES];
}

@end
*/