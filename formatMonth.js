function getMonthStartAndEndDate(monthString) {
    const dateObject = new Date(monthString);
  
    const year = dateObject.getFullYear(); // Get the full year
    const month = dateObject.getMonth(); // Get the month (0-11)
  
    // Calculate the start date of the month
    const startDate = new Date(year, month, 1);
    const formattedStartDate = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`;
  
    // Calculate the end date of the month
    const endDate = new Date(year, month + 1, 0);
    const formattedEndDate = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;
  
    return {
      startDate: formattedStartDate,
      endDate: formattedEndDate
    };
  }
  
  const monthString = 'Thu Feb 23 2023 00:00:00 GMT+0700 (Giờ Đông Dương)';
  const { startDate, endDate } = getMonthStartAndEndDate(monthString);
  
  console.log(startDate); // Output: '2023-12-01'
  console.log(endDate); // Output: '2023-12-31'