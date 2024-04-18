const fs = require('fs');
const csv = require('csv-parser');

class Cell {
    constructor(oem, model, launch_announced, launch_status, body_dimensions, body_weight, body_sim, display_type, display_size, display_resolution, features_sensors, platform_os) {
        this.oem = oem;
        this.model = model;
        this.launch_announced = parseInt(launch_announced.match(/\d{4}/)?.[0]) || null; 
        this.launch_status = this.parseLaunchStatus(launch_status);
        this.body_dimensions = body_dimensions || null;
        
        if (body_weight !== null) {
            const bodyWeightMatch = body_weight.match(/\d+(?:\.\d+)?/);
            this.body_weight = bodyWeightMatch !== null ? parseFloat(bodyWeightMatch[0]) : null;
        } else {
            this.body_weight = null;
        }
        
        this.body_sim = body_sim === "No" ? null : body_sim;
        this.display_type = display_type || null;

        // Check if display_size is null before parsing, was running to issues reading the file
        if (display_size !== null) {
            const displaySizeMatch = display_size.match(/\d+(?:\.\d+)?/);
            this.display_size = displaySizeMatch !== null ? parseFloat(displaySizeMatch[0]) : null;
        } else {
            this.display_size = null;
        }
        
        this.display_resolution = display_resolution || null;
        this.features_sensors = features_sensors || null;
        this.platform_os = platform_os.split(',')[0].trim() || null;
    }

    parseLaunchStatus(status) {
        if (status === "Discontinued" || status === "Cancelled") {
            return status;
        } else {
            return parseInt(status.match(/\d{4}/)[0]) || null; //extracting the year from string
        }
    }

    toString() {
        return `${this.oem} ${this.model}`;
    }

    static calculateMeanBodyWeight(cellArray) {
        let weightSum = {};
        let weightCount = {};
        
        //calculating sum and count for each company's body weight
        for (let cell of cellArray) {
            if (cell.body_weight !== null) {
                weightSum[cell.oem] = (weightSum[cell.oem] || 0) + cell.body_weight;
                weightCount[cell.oem] = (weightCount[cell.oem] || 0) + 1;
            }
        }

        //calculating average body weight for each company
        let averages = {};
        for (let oem in weightSum) {
            averages[oem] = weightSum[oem] / weightCount[oem];
        }

        //finding the company with the highest average body weight
        let maxAverage = 0;
        let maxOEM = null;
        for (let oem in averages) {
            if (averages[oem] > maxAverage) {
                maxAverage = averages[oem];
                maxOEM = oem;
            }
        }

        return maxOEM;
    }

    static phonesAnnouncedReleasedDifferentYear(cellArray) {
        let result = [];
        for (let cell of cellArray) {
            if (cell.launch_announced !== null && cell.launch_status !== null && cell.launch_announced !== cell.launch_status) {
                result.push(cell);
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
            if (cell.launch_announced !== null && cell.launch_announced > 1999) {
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
fs.createReadStream('C:\\Users\\mparu\\OneDrive\\Documents\\GitHub\\AlternativeLanguageProject\\cells.csv')
    .pipe(csv())
    .on('data', (row) => {
        cellData.push(new Cell(row.oem, row.model, row.launch_announced, row.launch_status, row.body_dimensions, row.body_weight, row.body_sim, row.display_type, row.display_size, row.display_resolution, row.features_sensors, row.platform_os));
    })
    .on('end', () => {
        //questions from readme file
        console.log("Company with the highest average weight of the phone body:", Cell.calculateMeanBodyWeight(cellData));
        
        let phonesReleasedInDifferentYear = Cell.phonesAnnouncedReleasedDifferentYear(cellData);
        if (phonesReleasedInDifferentYear.length > 0) {
            console.log("Phones announced in one year and released in another:");
            for (let phone of phonesReleasedInDifferentYear) {
                console.log(`${phone.oem} ${phone.model}`);
            }
        } else {
            console.log("No phones were announced in one year and released in another.");
        }

        console.log("Number of phones with only one feature sensor:", Cell.countPhonesWithOneSensor(cellData));
        console.log("Year with the most phones launched later than 1999:", Cell.yearWithMostPhonesLaunched(cellData));
    });
