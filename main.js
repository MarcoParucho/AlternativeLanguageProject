const fs = require('fs');
const csv = require('csv-parser');

class Cell {
    constructor(oem, model, launch_announced, launch_status, body_dimensions, body_weight, body_sim, display_type, display_size, display_resolution, features_sensors, platform_os) {
        this.oem = oem;
        this.model = model;
        this.launch_announced = parseInt(launch_announced.match(/\d{4}/)[0]) || null; // Extract year from string
        this.launch_status = this.parseLaunchStatus(launch_status);
        this.body_dimensions = body_dimensions || null;
        this.body_weight = parseFloat(body_weight.match(/\d+(?:\.\d+)?/)[0]) || null; // Extract numeric value
        this.body_sim = body_sim === "No" ? null : body_sim;
        this.display_type = display_type || null;
        this.display_size = parseFloat(display_size.match(/\d+(?:\.\d+)?/)[0]) || null; // Extract numeric value
        this.display_resolution = display_resolution || null;
        this.features_sensors = features_sensors || null;
        this.platform_os = platform_os.split(',')[0].trim() || null; // Extract first part before comma
    }

 
    parseLaunchStatus(status) {
        if (status === "Discontinued" || status === "Cancelled") {
            return status;
        } else {
            return parseInt(status.match(/\d{4}/)[0]) || null; // Extract year from string
        }
    }

 
    toString() {
        return `${this.oem} ${this.model}`;
    }

    
    static calculateMeanBodyWeight(cellArray) {
        let totalWeight = 0;
        let count = 0;
        for (let cell of cellArray) {
            if (cell.body_weight !== null) {
                totalWeight += cell.body_weight;
                count++;
            }
        }
        return totalWeight / count;
    }

   
    static phonesAnnouncedReleasedDifferentYear(cellArray) {
        let result = [];
        for (let cell of cellArray) {
            if (cell.launch_announced !== null && cell.launch_status !== null && cell.launch_announced !== cell.launch_status) {
                result.push(cell.toString());
            }
        }
        return result;
    }

 
    static countPhonesWithOneSensor(cellArray) {
        let count = 0;
        for (let cell of cellArray) {
            if (cell.features_sensors !== null && cell.features_sensors.trim().split(',').length === 1) {
                count++;
            }
        }
        return count;
    }


    static yearWithMostPhonesLaunched(cellArray) {
        let yearMap = new Map();
        for (let cell of cellArray) {
            if (cell.launch_announced !== null) {
                if (yearMap.has(cell.launch_announced)) {
                    yearMap.set(cell.launch_announced, yearMap.get(cell.launch_announced) + 1);
                } else {
                    yearMap.set(cell.launch_announced, 1);
                }
            }
        }
        let maxYear = null;
        let maxCount = 0;
        for (let [year, count] of yearMap) {
            if (count > maxCount) {
                maxYear = year;
                maxCount = count;
            }
        }
        return maxYear;
    }
}


let cellData = [];
fs.createReadStream('')
    .pipe(csv())
    .on('data', (row) => {
        cellData.push(new Cell(row.oem, row.model, row.launch_announced, row.launch_status, row.body_dimensions, row.body_weight, row.body_sim, row.display_type, row.display_size, row.display_resolution, row.features_sensors, row.platform_os));
    })
    .on('end', () => {
        console.log("Mean body weight:", Cell.calculateMeanBodyWeight(cellData));
        console.log("Phones announced in one year and released in another:", Cell.phonesAnnouncedReleasedDifferentYear(cellData));
        console.log("Phones with only one feature sensor:", Cell.countPhonesWithOneSensor(cellData));
        console.log("Year with the most phones launched:", Cell.yearWithMostPhonesLaunched(cellData));
    });
