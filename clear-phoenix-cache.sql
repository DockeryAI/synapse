-- Clear incorrect Phoenix, AZ detection for thephoenixinsurance.com
DELETE FROM location_detection_cache
WHERE domain = 'thephoenixinsurance.com';
