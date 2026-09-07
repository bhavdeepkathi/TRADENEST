import bcrypt from 'bcryptjs';
import { PrismaClient, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

type Department = {
	name: string;
	image: string;
	products: Array<{ name: string; subcategory: string; brand: string; price: number }>;
};

const departments: Department[] = [
	{ name: 'Mobiles & Tablets', image: 'smartphone tablet', products: [
		{ name: 'Nova X1 5G Smartphone', subcategory: '5G Smartphones', brand: 'Nova', price: 18999 },
		{ name: 'PixelEdge Pro 5G', subcategory: 'Camera Phones', brand: 'PixelEdge', price: 32999 },
		{ name: 'GalaxyMax S25 5G', subcategory: 'Flagship Smartphones', brand: 'GalaxyMax', price: 64999 },
		{ name: 'OneCore Ultra 5G', subcategory: 'Gaming Smartphones', brand: 'OneCore', price: 27999 },
		{ name: 'VivoStyle V70', subcategory: 'Mid-Range Smartphones', brand: 'VivoStyle', price: 24999 },
		{ name: 'MotoFusion G85', subcategory: 'Budget Smartphones', brand: 'MotoFusion', price: 15999 },
		{ name: 'Realme Neo 5G', subcategory: 'Budget Smartphones', brand: 'Realme', price: 13999 },
		{ name: 'Oppo Vision Pro 5G', subcategory: 'Camera Phones', brand: 'Oppo', price: 29999 },
		{ name: 'Poco Turbo X', subcategory: 'Gaming Smartphones', brand: 'Poco', price: 21999 },
		{ name: 'SlateGo Student Tab 11', subcategory: 'Student Tablets', brand: 'SlateGo', price: 14999 },
	] },
	{ name: 'Computers & Laptops', image: 'laptop computer', products: [
		{ name: 'ProBook Air 14', subcategory: 'Ultrabooks', brand: 'ProBook', price: 58990 },
		{ name: 'UltraTech Gaming 15', subcategory: 'Gaming Laptops', brand: 'UltraTech', price: 74990 },
		{ name: 'DevMaster Pro 14', subcategory: 'Programming Laptops', brand: 'DevMaster', price: 82990 },
		{ name: 'CreatorBook 16', subcategory: 'Creator Laptops', brand: 'CreatorBook', price: 94990 },
		{ name: 'StudentBook 15', subcategory: 'Student Laptops', brand: 'StudentBook', price: 38990 },
		{ name: 'BusinessPro 14', subcategory: 'Business Laptops', brand: 'BusinessPro', price: 67990 },
		{ name: 'DeskCore Mini PC', subcategory: 'Mini PCs', brand: 'DeskCore', price: 32990 },
		{ name: 'ViewPoint 27 Monitor', subcategory: 'Monitors', brand: 'ViewPoint', price: 18990 },
		{ name: 'KeyForge Mechanical Keyboard', subcategory: 'Mechanical Keyboards', brand: 'KeyForge', price: 4999 },
		{ name: 'SwiftClick Wireless Mouse', subcategory: 'Wireless Mice', brand: 'SwiftClick', price: 1299 },
	] },
	{ name: 'Electronics', image: 'headphones speaker television camera', products: [
		{ name: 'SoundBeat Air Pro Earbuds', subcategory: 'Bluetooth Earbuds', brand: 'SoundBeat', price: 2999 },
		{ name: 'BassMax Wireless Headphones', subcategory: 'Wireless Headphones', brand: 'BassMax', price: 5999 },
		{ name: 'SonicPods Pro', subcategory: 'Bluetooth Earbuds', brand: 'SonicPods', price: 4499 },
		{ name: 'GameSound X1 Headset', subcategory: 'Gaming Headsets', brand: 'GameSound', price: 3499 },
		{ name: 'BoomBox Mini Speaker', subcategory: 'Bluetooth Speakers', brand: 'BoomBox', price: 2499 },
		{ name: 'CinemaSound 5.1 Soundbar', subcategory: 'Soundbars', brand: 'CinemaSound', price: 12999 },
		{ name: 'VisionArc 43 Smart TV', subcategory: 'Smart TVs', brand: 'VisionArc', price: 28999 },
		{ name: 'TrailCam 4K Action Camera', subcategory: 'Action Cameras', brand: 'TrailCam', price: 8999 },
		{ name: 'LumaShot Mirrorless Camera', subcategory: 'Mirrorless Cameras', brand: 'LumaShot', price: 54990 },
		{ name: 'SteadyPro Camera Tripod', subcategory: 'Tripods', brand: 'SteadyPro', price: 2799 },
	] },
	{ name: 'Large Home Appliances', image: 'refrigerator washing machine air conditioner appliance', products: [
		{ name: 'CoolFresh 265L Refrigerator', subcategory: 'Double Door Refrigerators', brand: 'CoolFresh', price: 28990 },
		{ name: 'WashPro 7.5kg Washing Machine', subcategory: 'Front Load Washing Machines', brand: 'WashPro', price: 25990 },
		{ name: 'ArcticCool 1.5 Ton AC', subcategory: 'Air Conditioners', brand: 'ArcticCool', price: 36990 },
		{ name: 'PureFlow RO Water Purifier', subcategory: 'Water Purifiers', brand: 'PureFlow', price: 12990 },
		{ name: 'CleanBot Robot Vacuum', subcategory: 'Vacuum Cleaners', brand: 'CleanBot', price: 22990 },
		{ name: 'AirPure Smart Air Purifier', subcategory: 'Air Purifiers', brand: 'AirPure', price: 8990 },
		{ name: 'HeatWave 15L Water Heater', subcategory: 'Water Heaters', brand: 'HeatWave', price: 7490 },
		{ name: 'BreezeBox Personal Air Cooler', subcategory: 'Air Coolers', brand: 'BreezeBox', price: 5990 },
		{ name: 'SparkleDish 12 Place Dishwasher', subcategory: 'Dishwashers', brand: 'SparkleDish', price: 32990 },
		{ name: 'FrostLine 190L Single Door Fridge', subcategory: 'Single Door Refrigerators', brand: 'FrostLine', price: 17990 },
	] },
	{ name: 'Kitchen Appliances', image: 'kitchen appliance blender coffee maker', products: [
		{ name: 'CrispChef Digital Air Fryer', subcategory: 'Air Fryers', brand: 'CrispChef', price: 4990 },
		{ name: 'GrindMate Mixer Grinder', subcategory: 'Mixer Grinders', brand: 'GrindMate', price: 3290 },
		{ name: 'FreshPress Slow Juicer', subcategory: 'Juicers', brand: 'FreshPress', price: 6990 },
		{ name: 'BrewCraft Coffee Maker', subcategory: 'Coffee Makers', brand: 'BrewCraft', price: 5490 },
		{ name: 'QuickBoil Electric Kettle', subcategory: 'Electric Kettles', brand: 'QuickBoil', price: 1490 },
		{ name: 'ToastEase Sandwich Maker', subcategory: 'Sandwich Makers', brand: 'ToastEase', price: 1890 },
		{ name: 'ChefPro 28L OTG Oven', subcategory: 'OTG Ovens', brand: 'ChefPro', price: 7490 },
		{ name: 'Inducta Smart Cooktop', subcategory: 'Induction Cooktops', brand: 'Inducta', price: 2390 },
		{ name: 'ChopSwift Food Processor', subcategory: 'Food Processors', brand: 'ChopSwift', price: 5990 },
		{ name: 'RiceRight Electric Cooker', subcategory: 'Rice Cookers', brand: 'RiceRight', price: 2790 },
	] },
	{ name: "Men's Fashion", image: 'mens fashion shirt sneakers watch', products: [
		{ name: 'Everyday Cotton Crew T-Shirt', subcategory: 'T-Shirts', brand: 'NorthThread', price: 699 },
		{ name: 'UrbanFit Oxford Shirt', subcategory: 'Formal Shirts', brand: 'UrbanFit', price: 1299 },
		{ name: 'DenimCraft Slim Jeans', subcategory: 'Jeans', brand: 'DenimCraft', price: 1799 },
		{ name: 'PaceRun Performance Sneakers', subcategory: 'Running Shoes', brand: 'PaceRun', price: 2499 },
		{ name: 'LoftLine Leather Loafers', subcategory: 'Loafers', brand: 'LoftLine', price: 2199 },
		{ name: 'Heritage Cotton Kurta', subcategory: 'Kurtas', brand: 'Heritage', price: 1499 },
		{ name: 'MoveFree Tapered Joggers', subcategory: 'Joggers', brand: 'MoveFree', price: 999 },
		{ name: 'ChronoArc Analog Watch', subcategory: 'Watches', brand: 'ChronoArc', price: 2999 },
		{ name: 'CarryPro Laptop Backpack', subcategory: 'Backpacks', brand: 'CarryPro', price: 1899 },
		{ name: 'UrbanHide Bi-Fold Wallet', subcategory: 'Wallets', brand: 'UrbanHide', price: 899 },
	] },
	{ name: "Women's Fashion", image: 'womens fashion dress handbag shoes', products: [
		{ name: 'LumaEase Ribbed Top', subcategory: 'Tops', brand: 'LumaEase', price: 899 },
		{ name: 'AsterBloom Printed Dress', subcategory: 'Dresses', brand: 'AsterBloom', price: 1899 },
		{ name: 'IndigoMuse Straight Jeans', subcategory: 'Jeans', brand: 'IndigoMuse', price: 1699 },
		{ name: 'Saanvi Handloom Saree', subcategory: 'Sarees', brand: 'Saanvi', price: 2499 },
		{ name: 'Meera Everyday Kurti', subcategory: 'Kurtis', brand: 'Meera', price: 999 },
		{ name: 'Velora Block Heels', subcategory: 'Heels', brand: 'Velora', price: 2299 },
		{ name: 'PetalTone Sling Bag', subcategory: 'Sling Bags', brand: 'PetalTone', price: 1499 },
		{ name: 'AurumLeaf Fashion Earrings', subcategory: 'Jewellery', brand: 'AurumLeaf', price: 799 },
		{ name: 'SwayStep Casual Sneakers', subcategory: 'Sneakers', brand: 'SwayStep', price: 1999 },
		{ name: 'SoftNest Satin Nightwear', subcategory: 'Nightwear', brand: 'SoftNest', price: 1199 },
	] },
	{ name: 'Beauty & Personal Care', image: 'skincare cosmetics beauty shampoo', products: [
		{ name: 'GlowKind Vitamin C Face Serum', subcategory: 'Face Serum', brand: 'GlowKind', price: 699 },
		{ name: 'PureLeaf Gentle Face Wash', subcategory: 'Face Wash', brand: 'PureLeaf', price: 349 },
		{ name: 'SunShield SPF 50 Gel', subcategory: 'Sunscreen', brand: 'SunShield', price: 599 },
		{ name: 'VelvetMatte Liquid Lip Color', subcategory: 'Lipstick', brand: 'VelvetMatte', price: 499 },
		{ name: 'RootRise Nourishing Shampoo', subcategory: 'Shampoo', brand: 'RootRise', price: 449 },
		{ name: 'SilkDrop Hair Serum', subcategory: 'Hair Serum', brand: 'SilkDrop', price: 399 },
		{ name: 'TrimEdge Rechargeable Trimmer', subcategory: 'Electric Trimmers', brand: 'TrimEdge', price: 1499 },
		{ name: 'AirGlow Ionic Hair Dryer', subcategory: 'Hair Dryers', brand: 'AirGlow', price: 1999 },
		{ name: 'CalmCloud Body Lotion', subcategory: 'Body Lotion', brand: 'CalmCloud', price: 299 },
		{ name: 'BrushBloom Everyday Makeup Kit', subcategory: 'Makeup Kits', brand: 'BrushBloom', price: 1299 },
	] },
	{ name: 'Home & Furniture', image: 'sofa furniture table chair bedroom', products: [
		{ name: 'Nestora 3-Seater Fabric Sofa', subcategory: 'Sofas', brand: 'Nestora', price: 24990 },
		{ name: 'Restwood Queen Platform Bed', subcategory: 'Queen Size Beds', brand: 'Restwood', price: 28990 },
		{ name: 'SleepSure Ortho Mattress', subcategory: 'Mattresses', brand: 'SleepSure', price: 11990 },
		{ name: 'Oakline Six-Shelf Bookcase', subcategory: 'Bookshelves', brand: 'Oakline', price: 6990 },
		{ name: 'ModuView TV Unit', subcategory: 'TV Units', brand: 'ModuView', price: 8490 },
		{ name: 'CedarNest Study Table', subcategory: 'Study Tables', brand: 'CedarNest', price: 5990 },
		{ name: 'ErgoHarbor Office Chair', subcategory: 'Office Chairs', brand: 'ErgoHarbor', price: 7990 },
		{ name: 'LumaGlow Table Lamp', subcategory: 'Lamps', brand: 'LumaGlow', price: 1299 },
		{ name: 'WeaveCraft Geometric Rug', subcategory: 'Rugs', brand: 'WeaveCraft', price: 2499 },
		{ name: 'FrameStory Gallery Wall Set', subcategory: 'Photo Frames', brand: 'FrameStory', price: 1599 },
	] },
	{ name: 'Home & Kitchen', image: 'cookware kitchen storage dining cleaning', products: [
		{ name: 'PressurePro 5L Pressure Cooker', subcategory: 'Pressure Cookers', brand: 'PressurePro', price: 2199 },
		{ name: 'PanCraft Non-Stick Frying Pan', subcategory: 'Non-Stick Pans', brand: 'PanCraft', price: 899 },
		{ name: 'SteelNest Cookware Set', subcategory: 'Cookware Sets', brand: 'SteelNest', price: 3499 },
		{ name: 'FreshLock Storage Container Set', subcategory: 'Food Containers', brand: 'FreshLock', price: 799 },
		{ name: 'SpiceGrid Six-Jar Rack', subcategory: 'Spice Racks', brand: 'SpiceGrid', price: 599 },
		{ name: 'HydraGo Steel Water Bottle', subcategory: 'Water Bottles', brand: 'HydraGo', price: 699 },
		{ name: 'DineAura 24-Piece Dinner Set', subcategory: 'Dinner Sets', brand: 'DineAura', price: 2299 },
		{ name: 'CleanGlide Spray Mop', subcategory: 'Mops', brand: 'CleanGlide', price: 1299 },
		{ name: 'BinBuddy Sensor Dustbin', subcategory: 'Dustbins', brand: 'BinBuddy', price: 1899 },
		{ name: 'BladeSmith Kitchen Knife Set', subcategory: 'Kitchen Knives', brand: 'BladeSmith', price: 999 },
	] },
	{ name: 'Grocery & Food', image: 'grocery food packaging rice coffee snacks', products: [
		{ name: 'GoldenGrain Premium Basmati Rice 5kg', subcategory: 'Rice', brand: 'GoldenGrain', price: 699 },
		{ name: 'HarvestHome Chakki Atta 5kg', subcategory: 'Atta', brand: 'HarvestHome', price: 329 },
		{ name: 'DailyDal Moong Dal 1kg', subcategory: 'Dal', brand: 'DailyDal', price: 159 },
		{ name: 'SunDrop Cold Pressed Oil 1L', subcategory: 'Cooking Oil', brand: 'SunDrop', price: 249 },
		{ name: 'ChaiTrail Assam Tea 500g', subcategory: 'Tea', brand: 'ChaiTrail', price: 299 },
		{ name: 'BeanStreet Filter Coffee 250g', subcategory: 'Coffee', brand: 'BeanStreet', price: 349 },
		{ name: 'CrunchMitra Roasted Namkeen', subcategory: 'Namkeen', brand: 'CrunchMitra', price: 129 },
		{ name: 'CocoaNest Dark Chocolate Bar', subcategory: 'Chocolates', brand: 'CocoaNest', price: 199 },
		{ name: 'MasalaRoute Everyday Spice Box', subcategory: 'Masalas', brand: 'MasalaRoute', price: 399 },
		{ name: 'QuickBowl Masala Noodles Pack', subcategory: 'Instant Noodles', brand: 'QuickBowl', price: 149 },
	] },
	{ name: 'Sports & Fitness', image: 'fitness gym yoga football cricket sports', products: [
		{ name: 'IronPeak Adjustable Dumbbells', subcategory: 'Dumbbells', brand: 'IronPeak', price: 3499 },
		{ name: 'FlexLoop Resistance Band Set', subcategory: 'Resistance Bands', brand: 'FlexLoop', price: 799 },
		{ name: 'ZenMat Premium Yoga Mat', subcategory: 'Yoga Mats', brand: 'ZenMat', price: 999 },
		{ name: 'RunDeck Foldable Treadmill', subcategory: 'Treadmills', brand: 'RunDeck', price: 28990 },
		{ name: 'SkipSprint Speed Rope', subcategory: 'Skipping Ropes', brand: 'SkipSprint', price: 399 },
		{ name: 'ProLeague Leather Football', subcategory: 'Footballs', brand: 'ProLeague', price: 899 },
		{ name: 'WillowEdge Kashmir Cricket Bat', subcategory: 'Cricket Bats', brand: 'WillowEdge', price: 2999 },
		{ name: 'AeroSpin Carbon Racket', subcategory: 'Badminton Rackets', brand: 'AeroSpin', price: 1899 },
		{ name: 'HydroSprint Fitness Bottle', subcategory: 'Water Bottles', brand: 'HydroSprint', price: 699 },
		{ name: 'GymTrail Ventilated Duffel', subcategory: 'Gym Bags', brand: 'GymTrail', price: 1299 },
	] },
	{ name: 'Toys & Games', image: 'toys board game building blocks children', products: [
		{ name: 'BuildBright Creative Block Box', subcategory: 'Building Blocks', brand: 'BuildBright', price: 999 },
		{ name: 'RoboRacer Remote Control Car', subcategory: 'Remote Control Cars', brand: 'RoboRacer', price: 1499 },
		{ name: 'WonderWood Strategy Board Game', subcategory: 'Board Games', brand: 'WonderWood', price: 799 },
		{ name: 'PuzzlePeak World Explorer', subcategory: 'Puzzle Games', brand: 'PuzzlePeak', price: 599 },
		{ name: 'TinyTale Adventure Doll', subcategory: 'Dolls', brand: 'TinyTale', price: 899 },
		{ name: 'STEMSpark Solar Robot Kit', subcategory: 'STEM Toys', brand: 'STEMSpark', price: 1299 },
		{ name: 'MelodyMates Kids Keyboard', subcategory: 'Musical Toys', brand: 'MelodyMates', price: 1099 },
		{ name: 'CloudHug Bear Soft Toy', subcategory: 'Soft Toys', brand: 'CloudHug', price: 699 },
		{ name: 'TrailFun Outdoor Ring Toss', subcategory: 'Outdoor Toys', brand: 'TrailFun', price: 499 },
		{ name: 'PixelQuest Game Controller', subcategory: 'Gaming Controllers', brand: 'PixelQuest', price: 1799 },
	] },
	{ name: 'Baby Products', image: 'baby products stroller toys nursery', products: [
		{ name: 'LittleNest Organic Cotton Bodysuits', subcategory: 'Baby Clothes', brand: 'LittleNest', price: 799 },
		{ name: 'SoftSteps Newborn Diapers Pack', subcategory: 'Diapers', brand: 'SoftSteps', price: 899 },
		{ name: 'PureBub Gentle Baby Wipes', subcategory: 'Baby Wipes', brand: 'PureBub', price: 249 },
		{ name: 'MilkMate Anti-Colic Bottles', subcategory: 'Baby Feeding Bottles', brand: 'MilkMate', price: 699 },
		{ name: 'TinyRide Compact Stroller', subcategory: 'Baby Strollers', brand: 'TinyRide', price: 6990 },
		{ name: 'SafeHaven Convertible Car Seat', subcategory: 'Baby Car Seats', brand: 'SafeHaven', price: 8990 },
		{ name: 'DreamPod Portable Crib', subcategory: 'Baby Cribs', brand: 'DreamPod', price: 5990 },
		{ name: 'CuddleCloud Baby Blanket', subcategory: 'Baby Blankets', brand: 'CuddleCloud', price: 799 },
		{ name: 'BrightBite Silicone Teether', subcategory: 'Baby Toys', brand: 'BrightBite', price: 299 },
		{ name: 'WatchNest HD Baby Monitor', subcategory: 'Baby Monitors', brand: 'WatchNest', price: 3499 },
	] },
	{ name: 'Books', image: 'books reading novel library', products: [
		{ name: 'The Monsoon Code', subcategory: 'Mystery', brand: 'Tradenest Books', price: 399 },
		{ name: 'Letters from a Quiet City', subcategory: 'Romance', brand: 'Tradenest Books', price: 349 },
		{ name: 'Orbit of Tomorrow', subcategory: 'Science Fiction', brand: 'Tradenest Books', price: 499 },
		{ name: 'Small Steps, Strong Habits', subcategory: 'Self Help', brand: 'Tradenest Books', price: 299 },
		{ name: 'The Practical Founder', subcategory: 'Business', brand: 'Tradenest Books', price: 599 },
		{ name: 'India in Everyday Stories', subcategory: 'History', brand: 'Tradenest Books', price: 449 },
		{ name: 'Code Patterns with TypeScript', subcategory: 'Programming Books', brand: 'Tradenest Books', price: 899 },
		{ name: 'Numbers Made Friendly', subcategory: 'Mathematics Books', brand: 'Tradenest Books', price: 499 },
		{ name: 'Little Lantern Storybook', subcategory: 'Story Books', brand: 'Tradenest Kids', price: 249 },
		{ name: 'Color Trails Activity Book', subcategory: 'Coloring Books', brand: 'Tradenest Kids', price: 199 },
	] },
	{ name: 'Automotive', image: 'car accessories motorcycle helmet driving', products: [
		{ name: 'RoadShield All-Weather Car Cover', subcategory: 'Car Covers', brand: 'RoadShield', price: 1299 },
		{ name: 'DriveMat Premium Car Mats', subcategory: 'Car Mats', brand: 'DriveMat', price: 2499 },
		{ name: 'ChargeDash 45W Car Charger', subcategory: 'Car Chargers', brand: 'ChargeDash', price: 799 },
		{ name: 'MountMate Magnetic Phone Mount', subcategory: 'Phone Mounts', brand: 'MountMate', price: 699 },
		{ name: 'ViewRide Dual Dash Camera', subcategory: 'Dash Cameras', brand: 'ViewRide', price: 4990 },
		{ name: 'MotoGuard Urban Helmet', subcategory: 'Helmets', brand: 'MotoGuard', price: 1899 },
		{ name: 'RideGrip Touring Gloves', subcategory: 'Riding Gloves', brand: 'RideGrip', price: 999 },
		{ name: 'BikeSafe Disc Lock', subcategory: 'Bike Locks', brand: 'BikeSafe', price: 799 },
		{ name: 'CleanDrive Car Care Kit', subcategory: 'Car Cleaning Kits', brand: 'CleanDrive', price: 899 },
		{ name: 'AirTrail Citrus Car Freshener', subcategory: 'Air Fresheners', brand: 'AirTrail', price: 249 },
	] },
	{ name: 'Travel & Luggage', image: 'suitcase luggage backpack travel', products: [
		{ name: 'VoyageCore  cabin Trolley', subcategory: 'Trolley Bags', brand: 'VoyageCore', price: 3499 },
		{ name: 'CarrySphere Hardshell Suitcase', subcategory: 'Suitcases', brand: 'CarrySphere', price: 4999 },
		{ name: 'TrailPack 35L Travel Backpack', subcategory: 'Backpacks', brand: 'TrailPack', price: 2199 },
		{ name: 'WorkWay Laptop Travel Bag', subcategory: 'Laptop Bags', brand: 'WorkWay', price: 1799 },
		{ name: 'RoamReady Weekender Duffel', subcategory: 'Duffel Bags', brand: 'RoamReady', price: 1499 },
		{ name: 'PackNest Travel Organizer Set', subcategory: 'Travel Organizers', brand: 'PackNest', price: 799 },
		{ name: 'PassportGuard RFID Holder', subcategory: 'Passport Holders', brand: 'PassportGuard', price: 499 },
		{ name: 'CloudRest Memory Foam Pillow', subcategory: 'Travel Pillows', brand: 'CloudRest', price: 699 },
		{ name: 'LockLoop TSA Luggage Lock', subcategory: 'Luggage Locks', brand: 'LockLoop', price: 399 },
		{ name: 'ClearTrip Toiletry Pouch', subcategory: 'Toiletry Bags', brand: 'ClearTrip', price: 599 },
	] },
	{ name: 'Pet Supplies', image: 'dog cat pet supplies food toys', products: [
		{ name: 'PawPlate Adult Dog Food', subcategory: 'Dog Food', brand: 'PawPlate', price: 899 },
		{ name: 'WhiskerWell Indoor Cat Food', subcategory: 'Cat Food', brand: 'WhiskerWell', price: 699 },
		{ name: 'TreatTrail Chicken Bites', subcategory: 'Pet Treats', brand: 'TreatTrail', price: 299 },
		{ name: 'LeadLove Reflective Dog Leash', subcategory: 'Dog Leashes', brand: 'LeadLove', price: 499 },
		{ name: 'CollarCraft Adjustable Collar', subcategory: 'Dog Collars', brand: 'CollarCraft', price: 349 },
		{ name: 'PawCloud Washable Pet Bed', subcategory: 'Pet Beds', brand: 'PawCloud', price: 1299 },
		{ name: 'BowlBuddy Steel Pet Bowl', subcategory: 'Pet Bowls', brand: 'BowlBuddy', price: 399 },
		{ name: 'FurFresh Grooming Brush', subcategory: 'Grooming Brushes', brand: 'FurFresh', price: 299 },
		{ name: 'CoatCare Oat Pet Shampoo', subcategory: 'Pet Shampoo', brand: 'CoatCare', price: 449 },
		{ name: 'SafePaws Travel Carrier', subcategory: 'Pet Carriers', brand: 'SafePaws', price: 1599 },
	] },
	{ name: 'Office & Stationery', image: 'notebook stationery office desk supplies', products: [
		{ name: 'NoteNest Hardcover Notebook', subcategory: 'Notebooks', brand: 'NoteNest', price: 249 },
		{ name: 'PlanRight Undated Diary', subcategory: 'Diaries', brand: 'PlanRight', price: 399 },
		{ name: 'InkFlow Gel Pen Set', subcategory: 'Pens', brand: 'InkFlow', price: 199 },
		{ name: 'MarkBright Study Highlighters', subcategory: 'Highlighters', brand: 'MarkBright', price: 149 },
		{ name: 'FileForm Document Folder Set', subcategory: 'Files', brand: 'FileForm', price: 249 },
		{ name: 'ClipPro Heavy Duty Stapler', subcategory: 'Staplers', brand: 'ClipPro', price: 299 },
		{ name: 'DeskDock Organizer Tray', subcategory: 'Desk Organizers', brand: 'DeskDock', price: 599 },
		{ name: 'WriteWall Magnetic Whiteboard', subcategory: 'Whiteboards', brand: 'WriteWall', price: 1299 },
		{ name: 'CountSmart Scientific Calculator', subcategory: 'Calculators', brand: 'CountSmart', price: 699 },
		{ name: 'SchoolTrail Ergonomic School Bag', subcategory: 'School Bags', brand: 'SchoolTrail', price: 999 },
	] },
	{ name: 'Gaming', image: 'gaming computer keyboard controller headset', products: [
		{ name: 'BattleForge Gaming PC', subcategory: 'Gaming PCs', brand: 'BattleForge', price: 89990 },
		{ name: 'NightRaid Gaming Laptop', subcategory: 'Gaming Laptops', brand: 'NightRaid', price: 79990 },
		{ name: 'FrameRush 27 Gaming Monitor', subcategory: 'Gaming Monitors', brand: 'FrameRush', price: 22990 },
		{ name: 'StrikeKey RGB Mechanical Keyboard', subcategory: 'Gaming Keyboards', brand: 'StrikeKey', price: 4999 },
		{ name: 'AimGrid Precision Gaming Mouse', subcategory: 'Gaming Mouse', brand: 'AimGrid', price: 2499 },
		{ name: 'EchoRaid Wireless Headset', subcategory: 'Gaming Headsets', brand: 'EchoRaid', price: 3999 },
		{ name: 'LevelSeat Racing Gaming Chair', subcategory: 'Gaming Chairs', brand: 'LevelSeat', price: 12990 },
		{ name: 'GlidePad XL Mouse Mat', subcategory: 'Mouse Pads', brand: 'GlidePad', price: 699 },
		{ name: 'CoreGrip Game Controller', subcategory: 'Game Controllers', brand: 'CoreGrip', price: 2999 },
		{ name: 'VistaVR Immersive Headset', subcategory: 'VR Headsets', brand: 'VistaVR', price: 24990 },
	] },
	{ name: 'Jewellery & Watches', image: 'jewellery watch ring earrings', products: [
		{ name: 'Aurelia Minimal Gold-Tone Ring', subcategory: 'Rings', brand: 'Aurelia', price: 899 },
		{ name: 'MiraDrop Pearl Earrings', subcategory: 'Earrings', brand: 'MiraDrop', price: 1299 },
		{ name: 'LustreLine Pendant Necklace', subcategory: 'Necklaces', brand: 'LustreLine', price: 1499 },
		{ name: 'AurumArc Stackable Bracelet', subcategory: 'Bracelets', brand: 'AurumArc', price: 799 },
		{ name: 'SonaLoop Everyday Bangles', subcategory: 'Bangles', brand: 'SonaLoop', price: 999 },
		{ name: 'TimeHalo Smart Watch', subcategory: 'Smart Watches', brand: 'TimeHalo', price: 2999 },
		{ name: 'DialCraft Classic Watch', subcategory: 'Analog Watches', brand: 'DialCraft', price: 2199 },
		{ name: 'PulseBand Fit Tracker', subcategory: 'Fitness Bands', brand: 'PulseBand', price: 1799 },
		{ name: 'ChainMuse Layered Chain', subcategory: 'Chains', brand: 'ChainMuse', price: 699 },
		{ name: 'GleamGrid Fashion Jewellery Set', subcategory: 'Fashion Jewellery', brand: 'GleamGrid', price: 1199 },
	] },
	{ name: 'Health & Wellness', image: 'health wellness fitness medical thermometer', products: [
		{ name: 'CareReady First Aid Kit', subcategory: 'First Aid Kits', brand: 'CareReady', price: 599 },
		{ name: 'TempSure Digital Thermometer', subcategory: 'Thermometers', brand: 'TempSure', price: 299 },
		{ name: 'WarmEase Electric Heating Pad', subcategory: 'Heating Pads', brand: 'WarmEase', price: 899 },
		{ name: 'RelaxRoll Shoulder Massager', subcategory: 'Massagers', brand: 'RelaxRoll', price: 1999 },
		{ name: 'VitalCheck Blood Pressure Monitor', subcategory: 'Blood Pressure Monitors', brand: 'VitalCheck', price: 1699 },
		{ name: 'OxyTrack Pulse Oximeter', subcategory: 'Pulse Oximeters', brand: 'OxyTrack', price: 699 },
		{ name: 'MoveMetric Fitness Tracker', subcategory: 'Fitness Trackers', brand: 'MoveMetric', price: 2499 },
		{ name: 'BalanceBlock Yoga Brick Set', subcategory: 'Yoga Accessories', brand: 'BalanceBlock', price: 499 },
		{ name: 'DailyCare Reusable Hot Pack', subcategory: 'Personal Care Products', brand: 'DailyCare', price: 299 },
		{ name: 'BreatheWell Steam Inhaler', subcategory: 'Personal Care Products', brand: 'BreatheWell', price: 999 },
	] },
	{ name: 'Musical Instruments', image: 'guitar keyboard drums musical instrument', products: [
		{ name: 'MelodyWood Acoustic Guitar', subcategory: 'Acoustic Guitars', brand: 'MelodyWood', price: 5999 },
		{ name: 'VoltString Electric Guitar', subcategory: 'Electric Guitars', brand: 'VoltString', price: 8999 },
		{ name: 'KeyTone Portable Keyboard', subcategory: 'Keyboards', brand: 'KeyTone', price: 6999 },
		{ name: 'PianoCraft 61-Key Digital Piano', subcategory: 'Pianos', brand: 'PianoCraft', price: 14990 },
		{ name: 'BeatForge Beginner Drum Kit', subcategory: 'Drums', brand: 'BeatForge', price: 12990 },
		{ name: 'BreezeNote Concert Ukulele', subcategory: 'Ukuleles', brand: 'BreezeNote', price: 2499 },
		{ name: 'StringVale Student Violin', subcategory: 'Violins', brand: 'StringVale', price: 3999 },
		{ name: 'RiverReed Bamboo Flute', subcategory: 'Flutes', brand: 'RiverReed', price: 799 },
		{ name: 'VocalArc USB Microphone', subcategory: 'Microphones', brand: 'VocalArc', price: 2999 },
		{ name: 'StandSmith Adjustable Instrument Stand', subcategory: 'Instrument Stands', brand: 'StandSmith', price: 1199 },
	] },
	{ name: 'Digital Products', image: 'design software laptop screen interface', products: [
		{ name: 'LaunchPad React Storefront Kit', subcategory: 'React Templates', brand: 'TRADENEST Studio', price: 2499 },
		{ name: 'Orbit UI Figma Design System', subcategory: 'Figma Templates', brand: 'TRADENEST Studio', price: 1799 },
		{ name: 'CanvasCraft Presentation Pack', subcategory: 'Presentation Templates', brand: 'TRADENEST Studio', price: 999 },
		{ name: 'SocialSpark Content Template Set', subcategory: 'Social Media Templates', brand: 'TRADENEST Studio', price: 799 },
		{ name: 'GlyphGrid Interface Icon Pack', subcategory: 'Icon Packs', brand: 'TRADENEST Studio', price: 699 },
		{ name: 'ResumeRise Professional Templates', subcategory: 'Resume Templates', brand: 'TRADENEST Studio', price: 499 },
		{ name: 'DevLaunch TypeScript Starter', subcategory: 'Code Templates', brand: 'TRADENEST Studio', price: 1999 },
		{ name: 'PromptPilot AI Workflow Kit', subcategory: 'AI Tools', brand: 'TRADENEST Studio', price: 1499 },
		{ name: 'PixelBloom Illustration Pack', subcategory: 'Illustration Packs', brand: 'TRADENEST Studio', price: 899 },
		{ name: 'MotionFrame Video Presets', subcategory: 'Video Templates', brand: 'TRADENEST Studio', price: 1299 },
	] },
	{ name: 'Gifting', image: 'gift box celebration flowers greeting card', products: [
		{ name: 'CelebrateTogether Artisan Gift Box', subcategory: 'Gift Sets', brand: 'CelebrateTogether', price: 1299 },
		{ name: 'NameStory Personalized Mug Set', subcategory: 'Personalized Gifts', brand: 'NameStory', price: 799 },
		{ name: 'PaperJoy Illustrated Card Bundle', subcategory: 'Greeting Cards', brand: 'PaperJoy', price: 299 },
		{ name: 'MemoryFrame Wooden Photo Frame', subcategory: 'Photo Frames', brand: 'MemoryFrame', price: 699 },
		{ name: 'CocoaParcel Celebration Chocolates', subcategory: 'Chocolates', brand: 'CocoaParcel', price: 999 },
		{ name: 'BloomBasket Desk Flower Gift', subcategory: 'Flowers', brand: 'BloomBasket', price: 599 },
		{ name: 'WarmWish Decorative Lantern', subcategory: 'Decorative Gifts', brand: 'WarmWish', price: 899 },
		{ name: 'BirthdayBright Party Hamper', subcategory: 'Birthday Gifts', brand: 'BirthdayBright', price: 1499 },
		{ name: 'TogetherTime Anniversary Box', subcategory: 'Anniversary Gifts', brand: 'TogetherTime', price: 1799 },
		{ name: 'ProPresent Corporate Desk Kit', subcategory: 'Corporate Gifts', brand: 'ProPresent', price: 999 },
	] },
];

function slugify(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const departmentImages: Record<string, string[]> = {
	'Mobiles & Tablets': ['1511707171634-5f897ff02aa9', '1526738549149-8e07eca6c147'],
	'Computers & Laptops': ['1496181133206-80ce9b88a853', '1524758631624-e2822e304c36', '1499951360447-b19be8fe80f5'],
	Electronics: ['1505740420928-5e560c06d30e', '1516035069371-29a1b244cc32'],
	'Large Home Appliances': ['1556911220-bff31c812dba', '1550009158-9ebf69173e03'],
	'Kitchen Appliances': ['1556911220-bff31c812dba', '1524758631624-e2822e304c36'],
	"Men's Fashion": ['1521572163474-6864f9cf17ab', '1496747611176-843222e1e57c'],
	"Women's Fashion": ['1496747611176-843222e1e57c', '1521572163474-6864f9cf17ab'],
	'Beauty & Personal Care': ['1596462502278-27bfdc403348', '1515562141207-7a88fb7ce338'],
	'Home & Furniture': ['1555041469-a586c61ea9bc', '1556911220-bff31c812dba'],
	'Home & Kitchen': ['1556911220-bff31c812dba', '1555041469-a586c61ea9bc'],
	'Grocery & Food': ['1542838132-92c53300491e', '1549465220-1a8b9238cd48'],
	'Sports & Fitness': ['1579952363873-27f3bade9f55', '1524758631624-e2822e304c36'],
	'Toys & Games': ['1596461404969-9ae70f2830c1', '1515488042361-ee00e0ddd4e4'],
	'Baby Products': ['1515488042361-ee00e0ddd4e4', '1596461404969-9ae70f2830c1'],
	Books: ['1544947950-fa07a98d237f', '1499951360447-b19be8fe80f5'],
	Automotive: ['1492144534655-ae79c964c9d7', '1502877338535-766e1452684a', '1493238792000-8113da705763'],
	'Travel & Luggage': ['1553062407-98eeb64c6a62', '1496181133206-80ce9b88a853'],
	'Pet Supplies': ['1583337130417-3346a1be7dee', '1515488042361-ee00e0ddd4e4'],
	'Office & Stationery': ['1499951360447-b19be8fe80f5', '1517245386807-bb43f82c33c4'],
	Gaming: ['1542751371-adc38448a05e', '1496181133206-80ce9b88a853', '1505740420928-5e560c06d30e'],
	'Jewellery & Watches': ['1515562141207-7a88fb7ce338', '1523275335684-37898b6baf30'],
	'Health & Wellness': ['1576091160399-112ba8d25d1d', '1519225421980-715cb0215aed'],
	'Musical Instruments': ['1524650359799-842906ca1c06', '1511379938547-c1f69419868d', '1520523839897-bd0b52f945a0'],
	'Digital Products': ['1558655146-d09347e92766', '1550009158-9ebf69173e03', '1499951360447-b19be8fe80f5'],
	Gifting: ['1549465220-1a8b9238cd48', '1513883049090-d0b7439799bf', '1519225421980-715cb0215aed'],
};

function imageFor(department: string, index: number): string {
	const imageIds = departmentImages[department] || departmentImages.Electronics;
	const imageId = imageIds[index % imageIds.length];
	return `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=800&h=800&q=80`;
}

async function main() {
	const passwordHash = await bcrypt.hash('Seller@123', 12);
	const sellerUser = await prisma.user.upsert({
		where: { email: 'seller@tradenest.local' },
		update: {},
		create: { email: 'seller@tradenest.local', passwordHash, firstName: 'Demo', lastName: 'Seller', role: 'SELLER', isVerified: true, isActive: true },
	});
	const seller = await prisma.seller.upsert({
		where: { userId: sellerUser.id },
		update: {},
		create: { userId: sellerUser.id, storeName: 'TRADENEST Marketplace', kycStatus: 'APPROVED' },
	});

	let productCount = 0;
	const seededSlugs = new Set<string>();
	for (const department of departments) {
		const category = await prisma.category.upsert({
			where: { slug: slugify(department.name) },
			update: { description: `Original demo products across ${department.name.toLowerCase()}.` },
			create: { name: department.name, slug: slugify(department.name), description: `Original demo products across ${department.name.toLowerCase()}.` },
		});

		for (const [index, item] of department.products.entries()) {
			const discountPercent = 8 + ((index * 7 + department.name.length) % 28);
			const mrp = Math.round(item.price / (1 - discountPercent / 100));
			const slug = slugify(item.name);
			seededSlugs.add(slug);
			const product = await prisma.product.upsert({
				where: { slug },
				update: {
					sellerId: seller.id,
					categoryId: category.id,
					title: item.name,
					brand: item.brand,
					subcategory: item.subcategory,
					description: `${item.name} from ${item.brand}, selected for the TRADENEST ${department.name.toLowerCase()} collection. Designed for dependable everyday use with practical features and a polished finish.`,
					price: item.price,
					mrp,
					discountPercent,
					  images: [imageFor(department.name, index)],
					tags: [department.name, item.subcategory, item.brand],
					status: ProductStatus.ACTIVE,
					ratingAvg: Number((4.1 + ((index + department.name.length) % 9) / 10).toFixed(1)),
					reviewCount: 48 + index * 37 + department.name.length,
				},
				create: {
					sellerId: seller.id,
					categoryId: category.id,
					title: item.name,
					slug,
					brand: item.brand,
					subcategory: item.subcategory,
					description: `${item.name} from ${item.brand}, selected for the TRADENEST ${department.name.toLowerCase()} collection. Designed for dependable everyday use with practical features and a polished finish.`,
					price: item.price,
					mrp,
					discountPercent,
					  images: [imageFor(department.name, index)],
					tags: [department.name, item.subcategory, item.brand],
					status: ProductStatus.ACTIVE,
					ratingAvg: Number((4.1 + ((index + department.name.length) % 9) / 10).toFixed(1)),
					reviewCount: 48 + index * 37 + department.name.length,
				},
			});
			await prisma.inventory.upsert({
				where: { productId: product.id },
				update: { sellerId: seller.id, quantity: 24 + ((index * 17 + department.name.length) % 120), reserved: 0 },
				create: { productId: product.id, sellerId: seller.id, quantity: 24 + ((index * 17 + department.name.length) % 120), reserved: 0 },
			});
			productCount += 1;
		}
	}

	const legacyProducts = await prisma.product.findMany({
		where: { status: ProductStatus.ACTIVE },
		select: { id: true, slug: true },
	});
	let legacyIndex = 0;
	for (const product of legacyProducts) {
		if (!seededSlugs.has(product.slug)) {
			await prisma.product.update({
				where: { id: product.id },
				data: { images: [imageFor('Digital Products', legacyIndex++)] },
			});
		}
	}

	console.log(`Seeded ${productCount} original marketplace products across ${departments.length} departments.`);
}

main().catch((error) => {
	console.error(error);
	throw error;
}).finally(async () => {
	await prisma.$disconnect();
});
