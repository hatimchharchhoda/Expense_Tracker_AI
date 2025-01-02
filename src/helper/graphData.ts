import _ from 'lodash';

// Define the transaction object type
interface Transaction {
    name: string;
    type: string;
    amount: number;
    color: string;
    date: string;
}

export function getSum(transactions: any[], type?: string) {
    // Group transactions by 'type'
    let sum = _(transactions)
        .groupBy("type")
        .map((objs, key) => {
            // If 'type' is not provided, return the sum of amounts for each type
            if (!type) {
                return {
                    'type': key,
                    'color': objs[0].color,
                    'total': _.sumBy(objs, "amount")
                };
            }
            // If 'type' is provided, return the sum for that specific type
            if (key === type) {
                return {
                    'type': key,
                    'color': objs[0].color, // Assuming color is the same for each group
                    'total': _.sumBy(objs, "amount")
                };
            }
        })
        .compact() // Remove undefined values (if no match for the given type)
        .value();

    return sum;
}
export function chartData(transactions: any[], custom?: any) {
    // Get summed data from getSum function
    const dataValue = getSum(transactions);

    // Extract unique background colors from transactions
    let bg = _.map(transactions, a => a.color);
    bg = _.uniq(bg); // Ensure we only have unique colors

    // Default chart configuration
    const config = {
        data: {
            datasets: [{
                data: _.map(dataValue, (item: any) => item.total),  // Use total value for the chart data
                backgroundColor: bg,  // Set background color from unique colors
                hoverOffset: 4,  // Offset on hover
                borderRadius: 30,  // Rounded corners
                spacing: 10  // Spacing between segments
            }]
        },
        options: {
            cutout: 115  // Size of the donut hole
        }
    };

    // Return custom config if provided, otherwise return the default config
    return custom ?? config;
}

export function getLabels(transaction : any[], type: string) {
    let amountSum = getSum(transaction);

    let Total = getTotal(transaction);

    let percent = _(amountSum)
        .map(objs => _.assign(objs, { percent: (100 * objs.total) / Total }))
        .value()

    return percent;
}

export function getTotal(transactions: any[]): number {
    // Get the summed data from getSum function
    const summedData = getSum(transactions);

    // Sum up the 'total' values from the summed data
    const total = _.sumBy(summedData, 'total');
    
    return total;
}