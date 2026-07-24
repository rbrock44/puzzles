import { Category } from '../objects/category';

export const CATEGORIES: Category[] = [
    {
        name: 'Handheld Puzzles',
        tiles: [
            // {
            //     title: 'Sliding Puzzle',
            //     description: 'Slide numbered tiles into order, one move at a time',
            //     icon: '🧩',
            //     param: 'sliding-puzzle',
            //     storageKey: 'puzzles-sliding-puzzle'
            // },
            {
                title: "Rack 'em Up",
                description: 'Tilt and shift to sort the balls into solid-colour rows',
                icon: '',
                param: 'rack-em-up',
                storageKey: 'puzzles-rack-em-up',
                centered: true,
                className: 'tile-rack-em-up'
            },
            {
                title: 'Top Spin',
                description: 'Just Put the Numbers in Order...',
                icon: '',
                param: 'top-spin',
                storageKey: 'puzzles-top-spin',
                centered: true,
                className: 'tile-top-spin'
            }
        ]
    }
];
